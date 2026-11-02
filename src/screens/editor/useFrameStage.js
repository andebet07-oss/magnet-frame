// Owns the editor's Konva stage. React renders the panels; this hook draws the frame
// imperatively by rebuilding it with buildFrame() whenever the document changes.
import { useLayoutEffect, useRef } from 'react';
import Konva from 'konva';
import { buildFrame } from '@/render/buildFrame';
import { buildGuides } from '@/render/guides';
import { transformPatch, nodeBox } from '@/render/nodeGeometry';
import { clampPhotoPosition, focusFromPlacement, ZOOM_MAX, ZOOM_MIN } from '@/model/photo';
import { frameBoxes } from '@/model/units';
import { useEditor } from '@/store/editorStore';

export const STAGE_PADDING = 40;

const ALL_ANCHORS = ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right'];
const TEXT_ANCHORS = ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'];

const TRANSFORMER_STYLE = {
  flipEnabled: false,
  ignoreStroke: true,
  rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
  rotationSnapTolerance: 3,
  rotateAnchorOffset: 24,
  anchorSize: 9,
  anchorCornerRadius: 2,
  anchorStroke: '#7c86e1',
  anchorFill: '#ffffff',
  borderStroke: '#7c86e1',
  borderStrokeWidth: 1.5,
  boundBoxFunc: (oldBox, newBox) => (Math.abs(newBox.width) < 4 || Math.abs(newBox.height) < 1 ? oldBox : newBox),
};

function transformerFor(el) {
  if (el.locked) return { enabledAnchors: [], rotateEnabled: false, borderDash: [4, 3] };
  if (el.type === 'text') return { enabledAnchors: TEXT_ANCHORS, keepRatio: true, rotateEnabled: true, borderDash: null };
  return { enabledAnchors: ALL_ANCHORS, keepRatio: el.type === 'image' || el.type === 'icon', rotateEnabled: true, borderDash: null };
}

const findNode = (s, id) => s.world?.findOne((n) => n.id() === id) ?? null;

/**
 * Selection handles, plus the photo-positioning mode: while it is on, dragging inside the
 * photo area moves the sample photo (clamped so it always covers the window) instead of the area.
 */
function applySelection(s, doc, selectedId, panPhoto) {
  const el = doc.elements.find((e) => e.id === selectedId);
  const photoEl = doc.elements.find((e) => e.type === 'photo');
  const photoNode = photoEl ? findNode(s, photoEl.id) : null;
  const sample = photoNode?.findOne('.samplePhoto') ?? null;
  const panning = Boolean(panPhoto && sample && photoEl.id === selectedId && !photoEl.locked);

  if (photoNode) photoNode.draggable(!photoEl.locked && !panning);
  if (sample) {
    sample.draggable(panning);
    sample.dragBoundFunc(
      panning
        ? (pos) => {
            const toAbsolute = photoNode.getAbsoluteTransform().copy();
            const local = toAbsolute.copy().invert().point(pos);
            return toAbsolute.point(clampPhotoPosition(photoNode.width(), photoNode.height(), sample.width(), sample.height(), local));
          }
        : null,
    );
  }

  const node = el && el.type !== 'background' && !panning ? findNode(s, selectedId) : null;
  if (!node) {
    s.transformer.nodes([]);
  } else {
    s.transformer.setAttrs(transformerFor(el));
    s.transformer.nodes([node]);
  }
  s.stage.container().style.cursor = panning ? 'grab' : '';
}

function bindElementEvents(s, doc) {
  const byId = new Map(doc.elements.map((el) => [el.id, el]));
  const container = s.stage.container();
  s.world.find('.element').forEach((node) => {
    const el = byId.get(node.id());
    if (!el) return;
    node.draggable(!el.locked);
    node.on('pointerdown', () => useEditor.getState().select(el.id));
    node.on('mouseenter', () => {
      if (!useEditor.getState().panPhoto) container.style.cursor = 'move';
    });
    node.on('mouseleave', () => {
      if (!useEditor.getState().panPhoto) container.style.cursor = '';
    });
    // Only react to the element itself, not to a child (the sample photo) being dragged inside it.
    node.on('dragend', (e) => {
      if (e.target !== node) return;
      const { x, y } = nodeBox(node);
      useEditor.getState().updateElement(el.id, { x, y });
    });
    node.on('transformend', (e) => {
      if (e.target !== node) return;
      useEditor.getState().updateElement(el.id, transformPatch(el, node, s.activeAnchor));
    });
  });

  // Photo area: double-click to position the sample photo; dragging it stores the new focus point.
  const photoEl = doc.elements.find((e) => e.type === 'photo');
  const photoNode = photoEl ? findNode(s, photoEl.id) : null;
  const sample = photoNode?.findOne('.samplePhoto');
  if (!photoNode || !sample) return;
  photoNode.on('dblclick dbltap', () => {
    if (photoEl.locked) return;
    useEditor.getState().select(photoEl.id);
    useEditor.getState().setPanPhoto(true);
  });
  sample.on('dragstart', () => {
    container.style.cursor = 'grabbing';
  });
  sample.on('dragend', () => {
    container.style.cursor = 'grab';
    const focus = focusFromPlacement(photoNode.width(), photoNode.height(), {
      x: sample.x(),
      y: sample.y(),
      width: sample.width(),
      height: sample.height(),
    });
    useEditor.getState().setPreview(focus, 'preview:pan');
  });
}

/**
 * @param hostRef     div the stage mounts into
 * @param pxPerMm     current screen scale (fit × zoom); 0 until the viewport is measured
 * @param getImage    asset lookup for buildFrame
 * @param version     bumps when fonts or images finish loading
 * @param showSample  draw the sample photo in the photo area
 * @param panPhoto    photo-positioning mode
 */
export function useFrameStage(hostRef, { doc, pxPerMm, selectedId, getImage, version, showSample, panPhoto }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const stage = new Konva.Stage({ container: hostRef.current, width: 1, height: 1 });
    const content = new Konva.Layer();
    const overlay = new Konva.Layer();
    const transformer = new Konva.Transformer(TRANSFORMER_STYLE);
    overlay.add(transformer);
    stage.add(content, overlay);
    const s = { stage, content, overlay, transformer, world: null, guides: null, activeAnchor: null };
    transformer.on('transformstart', () => {
      s.activeAnchor = transformer.getActiveAnchor();
    });
    // A press on empty canvas (or the locked background) clears the selection.
    stage.on('pointerdown', (e) => {
      if (e.target === stage || (e.target.getLayer() === content && !e.target.findAncestor('.element', true))) {
        useEditor.getState().select(null);
      }
    });
    // While positioning the photo, the mouse wheel zooms it.
    stage.on('wheel', (e) => {
      const state = useEditor.getState();
      if (!state.panPhoto) return;
      e.evt.preventDefault();
      const zoom = state.history?.present.preview?.zoom ?? 1;
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * (e.evt.deltaY < 0 ? 1.08 : 1 / 1.08)));
      state.setPreview({ zoom: Math.round(next * 100) / 100 }, 'preview:zoom');
    });
    ref.current = s;
    return () => {
      stage.destroy();
      ref.current = null;
    };
  }, [hostRef]);

  useLayoutEffect(() => {
    const s = ref.current;
    if (!s || !pxPerMm) return;
    const { bleed } = frameBoxes(doc.size);
    const pad = STAGE_PADDING;
    s.stage.size({ width: Math.ceil(bleed.width * pxPerMm + 2 * pad), height: Math.ceil(bleed.height * pxPerMm + 2 * pad) });
    const origin = { x: pad - bleed.x * pxPerMm, y: pad - bleed.y * pxPerMm };

    s.transformer.nodes([]);
    s.content.destroyChildren();
    s.guides?.destroy();

    // Paper behind the design (editor only): transparent areas print as white.
    s.content.add(
      new Konva.Rect({
        x: pad,
        y: pad,
        width: bleed.width * pxPerMm,
        height: bleed.height * pxPerMm,
        fill: '#ffffff',
        shadowColor: '#000000',
        shadowBlur: 24,
        shadowOpacity: 0.35,
        listening: false,
      }),
    );
    s.world = buildFrame(doc, { getImage, pxPerMm, photo: showSample ? 'sample' : 'placeholder' });
    s.world.position(origin);
    s.content.add(s.world);

    s.guides = buildGuides(doc.size, pxPerMm);
    s.guides.position(origin);
    s.overlay.add(s.guides);
    s.guides.moveToBottom();

    bindElementEvents(s, doc);
    const state = useEditor.getState();
    applySelection(s, doc, state.selectedId, state.panPhoto);
    s.stage.batchDraw();
  }, [doc, pxPerMm, getImage, version, showSample]);

  useLayoutEffect(() => {
    const s = ref.current;
    if (!s?.world) return;
    applySelection(s, doc, selectedId, panPhoto);
    s.stage.batchDraw();
  }, [doc, selectedId, panPhoto]);
}
