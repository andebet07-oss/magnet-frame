// Owns the editor's Konva stage. React renders the panels; this hook draws the frame
// imperatively by rebuilding it with buildFrame() whenever the document changes.
import { useLayoutEffect, useRef } from 'react';
import Konva from 'konva';
import { buildFrame } from '@/render/buildFrame';
import { buildGuides } from '@/render/guides';
import { transformPatch, nodeBox } from '@/render/nodeGeometry';
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
  return { enabledAnchors: ALL_ANCHORS, keepRatio: el.type === 'image', rotateEnabled: true, borderDash: null };
}

function attachTransformer(s, doc, selectedId) {
  const el = doc.elements.find((e) => e.id === selectedId);
  const node = el && el.type !== 'background' ? s.world?.findOne((n) => n.id() === selectedId) : null;
  if (!node) {
    s.transformer.nodes([]);
    return;
  }
  s.transformer.setAttrs(transformerFor(el));
  s.transformer.nodes([node]);
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
      container.style.cursor = 'move';
    });
    node.on('mouseleave', () => {
      container.style.cursor = '';
    });
    node.on('dragend', () => {
      const { x, y } = nodeBox(node);
      useEditor.getState().updateElement(el.id, { x, y });
    });
    node.on('transformend', () => {
      useEditor.getState().updateElement(el.id, transformPatch(el, node, s.activeAnchor));
    });
  });
}

/**
 * @param hostRef   div the stage mounts into
 * @param pxPerMm   current screen scale (fit × zoom); 0 until the viewport is measured
 * @param getImage  asset lookup for buildFrame
 * @param version   bumps when fonts or images finish loading
 */
export function useFrameStage(hostRef, { doc, pxPerMm, selectedId, getImage, version }) {
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
      if (e.target === stage || (e.target.getLayer() === content && !e.target.hasName('element'))) {
        useEditor.getState().select(null);
      }
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
    s.world = buildFrame(doc, { getImage, pxPerMm });
    s.world.position(origin);
    s.content.add(s.world);

    s.guides = buildGuides(doc.size, pxPerMm);
    s.guides.position(origin);
    s.overlay.add(s.guides);
    s.guides.moveToBottom();

    bindElementEvents(s, doc);
    attachTransformer(s, doc, useEditor.getState().selectedId);
    s.stage.batchDraw();
  }, [doc, pxPerMm, getImage, version]);

  useLayoutEffect(() => {
    const s = ref.current;
    if (!s?.world) return;
    attachTransformer(s, doc, selectedId);
    s.overlay.batchDraw();
  }, [doc, selectedId]);
}
