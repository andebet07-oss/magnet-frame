// THE renderer: turns a template document into Konva nodes.
// The editor, thumbnails and (stage 4) export all draw through this one function,
// so what is saved or exported can't drift from what the editor shows.
import Konva from 'konva';
import { coverCrop, frameBoxes, ptToMm } from '@/model/units';
import { detectDirection } from '@/model/text';
import { photoPlacement } from '@/model/photo';
import { normalizeSymbols, withSymbols } from '@/fonts/textSymbols';

// Konva world units per mm. Working in 0.1 mm keeps canvas font sizes in a normal pixel range
// (an 18 pt title is 63.5 units, not 6.35), so text measurement and line breaks are stable
// at every zoom level and export resolution.
export const U = 10;

/**
 * @param doc       template document
 * @param getImage  (path) => HTMLImageElement | null
 * @param pxPerMm   output scale
 * @param photo     what fills the photo area: 'placeholder' (grey + label), 'sample' (the sample photo, if any)
 *                  or 'cutout' (a transparent hole, for the print file)
 * @returns Konva.Group whose (0,0) is the top-left of the cut line, clipped to the bleed box
 */
export function buildFrame(doc, { getImage, pxPerMm, photo = 'placeholder' }) {
  const { bleed } = frameBoxes(doc.size);
  const world = new Konva.Group({
    name: 'world',
    scaleX: pxPerMm / U,
    scaleY: pxPerMm / U,
    clipX: bleed.x * U,
    clipY: bleed.y * U,
    clipWidth: bleed.width * U,
    clipHeight: bleed.height * U,
  });
  for (const el of doc.elements) {
    if (el.visible === false) continue;
    const node = el.type === 'photo' ? buildPhotoArea(el, doc, getImage, photo) : buildElement(el, doc, getImage);
    if (node) world.add(node);
  }
  return world;
}

function buildElement(el, doc, getImage) {
  switch (el.type) {
    case 'background':
      return buildBackground(el, doc.size, getImage);
    case 'text':
      return buildText(el);
    case 'image':
      return buildImage(el, getImage);
    case 'shape':
      return buildShape(el);
    case 'icon':
      return buildIcon(el);
    default:
      return null;
  }
}

// Model x/y is the top-left of the unrotated box and rotation turns around the box centre,
// so each node is positioned at its centre with an offset of half its size.
function boxAttrs(el, heightMm = el.height) {
  const w = el.width * U;
  const h = heightMm * U;
  return {
    id: el.id,
    name: 'element',
    x: el.x * U + w / 2,
    y: el.y * U + h / 2,
    width: w,
    height: h,
    offsetX: w / 2,
    offsetY: h / 2,
    rotation: el.rotation || 0,
    opacity: el.opacity ?? 1,
    listening: !el.locked,
  };
}

function buildBackground(el, size, getImage) {
  const { bleed } = frameBoxes(size);
  const box = { x: bleed.x * U, y: bleed.y * U, width: bleed.width * U, height: bleed.height * U };
  const group = new Konva.Group({ id: el.id, name: 'background', listening: false, opacity: el.opacity ?? 1 });
  if (el.fill) group.add(new Konva.Rect({ ...box, fill: el.fill }));
  const img = el.image ? getImage(el.image) : null;
  if (img) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const crop = iw && ih ? coverCrop(iw, ih, box.width, box.height) : undefined;
    group.add(new Konva.Image({ ...box, image: img, crop }));
  }
  return group;
}

const PLACEHOLDER_FILL = '#D7DBE2';
const PLACEHOLDER_INK = '#7B8190';

/** Outline of the photo window in its own coordinates: rectangle (optionally rounded) or ellipse. */
function photoWindowPath(ctx, el, w, h) {
  if (el.shape === 'ellipse') {
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    return;
  }
  const r = Math.min((el.cornerRadiusMm || 0) * U, w / 2, h / 2);
  if (r > 0) ctx.roundRect(0, 0, w, h, r);
  else ctx.rect(0, 0, w, h);
}

function buildPhotoArea(el, doc, getImage, mode) {
  const attrs = boxAttrs(el);
  const { width: w, height: h } = attrs;
  if (mode === 'cutout') {
    // Print file: erase everything drawn so far inside the window; layers above it still draw on top.
    return new Konva.Shape({
      ...attrs,
      opacity: 1,
      fill: '#000',
      globalCompositeOperation: 'destination-out',
      sceneFunc: (ctx, shape) => {
        ctx.beginPath();
        photoWindowPath(ctx, el, w, h);
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      },
    });
  }
  const group = new Konva.Group({ ...attrs, clipFunc: (ctx) => photoWindowPath(ctx, el, w, h) });
  // Konva sizes a group by its children and ignores the clip, so a zoomed sample photo would make the
  // selection handles far bigger than the window. The area's bounds are the window itself.
  boundToBox(group, w, h);
  const sample = mode === 'sample' && doc.preview?.photo ? getImage(doc.preview.photo) : null;
  if (sample) {
    const placement = photoPlacement(w, h, sample.naturalWidth || sample.width, sample.naturalHeight || sample.height, doc.preview);
    group.add(new Konva.Image({ name: 'samplePhoto', image: sample, ...placement }));
    return group;
  }
  group.add(new Konva.Rect({ width: w, height: h, fill: PLACEHOLDER_FILL }));
  group.add(
    new Konva.Text({
      width: w,
      height: h,
      text: 'התמונה כאן',
      fontFamily: 'Heebo',
      fontSize: Math.min(w, h) * 0.1,
      fill: PLACEHOLDER_INK,
      align: 'center',
      verticalAlign: 'middle',
      direction: 'rtl',
      listening: false,
    }),
  );
  return group;
}

/** Makes a group report its own box as its bounds (selection handles), whatever its children draw. */
function boundToBox(group, w, h) {
  group.getClientRect = (config = {}) => {
    const rect = { x: 0, y: 0, width: w, height: h };
    return config.skipTransform ? rect : group._transformedRect(rect, config.relativeTo);
  };
}

function buildIcon(el) {
  const attrs = boxAttrs(el);
  const [vx, vy, vw, vh] = el.viewBox ?? [0, 0, 24, 24];
  const sx = attrs.width / vw;
  const sy = attrs.height / vh;
  const group = new Konva.Group(attrs);
  group.add(new Konva.Path({ data: el.path, fill: el.color, x: -vx * sx, y: -vy * sy, scaleX: sx, scaleY: sy }));
  // The path's own bounds are a little smaller than its grid; handles follow the full icon box.
  boundToBox(group, attrs.width, attrs.height);
  return group;
}

function buildText(el) {
  const text = normalizeSymbols(el.text);
  const node = new Konva.Text({
    text,
    // Hearts, rings and sparkles in the text come from the symbols font, in the text's colour.
    fontFamily: withSymbols(el.font),
    fontStyle: String(el.weight ?? 400),
    fontSize: ptToMm(el.sizePt) * U,
    lineHeight: el.lineHeight ?? 1.2,
    fill: el.color,
    align: el.align ?? 'center',
    direction: detectDirection(text),
    width: el.width * U,
    wrap: 'word',
  });
  // Height follows the content: measure, then position around the centre like every other element.
  node.setAttrs(boxAttrs(el, node.height() / U));
  node.height(undefined);
  return node;
}

function buildImage(el, getImage) {
  const img = getImage(el.src);
  if (!img) return new Konva.Rect({ ...boxAttrs(el), fill: 'rgba(128,128,128,0.25)' });
  return new Konva.Image({ ...boxAttrs(el), image: img });
}

function buildShape(el) {
  const paint = {
    fill: el.fill || undefined,
    stroke: el.stroke || undefined,
    strokeWidth: (el.strokeWidthMm || 0) * U,
    // Dashed outline: dashes and gaps of `dashMm`.
    dash: el.dashMm > 0 ? [el.dashMm * U, el.dashMm * U] : undefined,
  };
  if (el.shape === 'ellipse') {
    // Konva ellipses are drawn around their origin, so no offset is needed.
    const { offsetX, offsetY, width, height, ...attrs } = boxAttrs(el);
    return new Konva.Ellipse({ ...attrs, ...paint, radiusX: width / 2, radiusY: height / 2 });
  }
  return new Konva.Rect({ ...boxAttrs(el), ...paint, cornerRadius: (el.cornerRadiusMm || 0) * U });
}
