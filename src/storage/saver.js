// Autosave: writes template.json shortly after each change and refreshes the thumbnail a bit later.
// All writes go through one promise chain, so two saves never touch the same file at once.
import { renderThumbnail } from '@/render/renderToCanvas';
import { saveTemplate, saveThumbnail } from './templateRepo';

const SAVE_DELAY_MS = 800;
const THUMBNAIL_DELAY_MS = 2500;

export function createSaver({ root, folder, assets, onStatus, onError }) {
  let pendingDoc = null;
  let thumbDoc = null;
  let saveTimer = null;
  let thumbTimer = null;
  let chain = Promise.resolve();

  function enqueue(task) {
    chain = chain.then(task);
    return chain;
  }

  function runSave() {
    clearTimeout(saveTimer);
    saveTimer = null;
    const doc = pendingDoc;
    pendingDoc = null;
    if (!doc) return chain;
    onStatus('saving');
    return enqueue(async () => {
      try {
        await saveTemplate(root, folder, doc);
        onStatus(pendingDoc ? 'dirty' : 'saved');
        scheduleThumbnail(doc);
      } catch (err) {
        console.error('[saver] save failed:', err);
        onStatus('error');
        onError('השמירה נכשלה. בדוק שהתיקייה עדיין קיימת ושיש הרשאה לכתוב בה.');
      }
    });
  }

  function runThumbnail() {
    clearTimeout(thumbTimer);
    thumbTimer = null;
    const doc = thumbDoc;
    thumbDoc = null;
    if (!doc) return chain;
    return enqueue(async () => {
      try {
        await saveThumbnail(root, folder, await renderThumbnail(doc, assets));
      } catch (err) {
        console.error('[saver] thumbnail failed:', err);
      }
    });
  }

  function scheduleThumbnail(doc) {
    thumbDoc = doc;
    clearTimeout(thumbTimer);
    thumbTimer = setTimeout(runThumbnail, THUMBNAIL_DELAY_MS);
  }

  return {
    schedule(doc) {
      pendingDoc = doc;
      onStatus('dirty');
      clearTimeout(saveTimer);
      saveTimer = setTimeout(runSave, SAVE_DELAY_MS);
    },
    scheduleThumbnail,
    isDirty: () => pendingDoc !== null,
    /** Write everything pending now and wait for it. */
    async flush() {
      runSave();
      await chain;
      // The save above may have just queued a thumbnail; render it now rather than after a delay.
      runThumbnail();
      await chain;
    },
  };
}
