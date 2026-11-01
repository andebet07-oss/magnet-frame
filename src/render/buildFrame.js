// THE renderer: turns a template document into Konva nodes.
// The editor, thumbnails and (stage 4) export all draw through this one function,
// so what is saved or exported can't drift from what the editor shows.
import Konva from 'konva';
import { coverCrop, frameBoxes, ptToMm } from '@/model/units';
import { detectDirection } from '@/model/text';

// Konva world units per mm. Working in 0.1 mm keeps canvas font sizes in a normal pixel range
// (an 18 pt title is 63.5 units, not 6.35), so text measurement and line breaks are stable
// at every zoom level and export resolution.
export const U = 10;

/**
 * @param doc       template document
 * @param getImage  (path) => HTMLImageElement | null
 * @param pxPerMm   output scale
 * @returns Konva.Group whose (0,0) is the top-left of the cut line, clipped to the bleed box
 */
export function buildFrame(doc, { getImage, pxPerMm }) {
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
    const node = buildElement(el, doc, getImage);
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

function buildText(el) {
  const node = new Konva.Text({
    text: el.text ?? '',
    fontFamily: el.font,
    fontStyle: String(el.weight ?? 400),
    fontSize: ptToMm(el.sizePt) * U,
    lineHeight: el.lineHeight ?? 1.2,
    fill: el.color,
    align: el.align ?? 'center',
    direction: detectDirection(el.text),
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
  };
  if (el.shape === 'ellipse') {
    // Konva ellipses are drawn around their origin, so no offset is needed.
    const { offsetX, offsetY, width, height, ...attrs } = boxAttrs(el);
    return new Konva.Ellipse({ ...attrs, ...paint, radiusX: width / 2, radiusY: height / 2 });
  }
  return new Konva.Rect({ ...boxAttrs(el), ...paint, cornerRadius: (el.cornerRadiusMm || 0) * U });
}
