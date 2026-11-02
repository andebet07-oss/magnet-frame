// Off-screen rendering of a template through the same buildFrame() the editor uses.
import Konva from 'konva';
import { assetPathsOf } from '@/model/elements';
import { frameBoxes } from '@/model/units';
import { ensureFonts, fontSpecsOf } from '@/fonts/loadFonts';
import { buildFrame } from './buildFrame';

const THUMBNAIL_WIDTH_PX = 360;

/**
 * @param area  'trim' (what the magnet shows) or 'bleed' (print file with bleed)
 * @returns HTMLCanvasElement at exactly box × pxPerMm pixels
 */
export async function renderFrameToCanvas(doc, { assets, pxPerMm, area = 'trim', photo = 'sample' }) {
  await Promise.all([ensureFonts(fontSpecsOf(doc)), assets.ensure(assetPathsOf(doc))]);
  const box = frameBoxes(doc.size)[area];
  const container = document.createElement('div');
  const stage = new Konva.Stage({
    container,
    width: Math.round(box.width * pxPerMm),
    height: Math.round(box.height * pxPerMm),
  });
  try {
    const layer = new Konva.Layer();
    stage.add(layer);
    const world = buildFrame(doc, { getImage: assets.get, pxPerMm, photo });
    world.position({ x: -box.x * pxPerMm, y: -box.y * pxPerMm });
    layer.add(world);
    // pixelRatio 1: the canvas has exactly the requested pixel count, whatever the screen density.
    return stage.toCanvas({ pixelRatio: 1 });
  } finally {
    stage.destroy();
  }
}

export async function renderThumbnail(doc, assets) {
  const pxPerMm = THUMBNAIL_WIDTH_PX / doc.size.widthMm;
  const canvas = await renderFrameToCanvas(doc, { assets, pxPerMm, area: 'trim' });
  return canvasToBlob(canvas);
}

export function canvasToBlob(canvas, type = 'image/png') {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))), type);
  });
}
