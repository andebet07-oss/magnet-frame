// Frame editor: properties (right), canvas (centre), layers (left).
import { useEffect, useMemo, useState } from 'react';
import { notify } from '@/ui/toast';
import { createAssetCache } from '@/storage/assetCache';
import { loadTemplate } from '@/storage/templateRepo';
import { useDoc, useEditor } from '@/store/editorStore';
import { EditorContext } from './EditorContext';
import { useAutosave, useEditorKeys } from './hooks';
import CanvasView from './CanvasView';
import LayerPanel from './LayerPanel';
import PropertiesPanel from './PropertiesPanel';
import Toolbar from './Toolbar';

export default function EditorScreen({ root, folder, onClose }) {
  const [ready, setReady] = useState(false);
  const assets = useMemo(() => createAssetCache(root, folder), [root, folder]);
  const doc = useDoc();

  useEffect(() => {
    let alive = true;
    loadTemplate(root, folder)
      .then((loaded) => {
        if (!alive) return;
        useEditor.getState().open(loaded);
        setReady(true);
      })
      .catch((err) => {
        console.error('[editor] could not open template:', err);
        notify('לא הצלחתי לפתוח את התבנית. ייתכן שהקובץ template.json פגום.');
        onClose();
      });
    return () => {
      alive = false;
      useEditor.getState().close();
    };
  }, [root, folder, onClose]);

  const { status, flush } = useAutosave({ root, folder, assets, ready });
  useEditorKeys({ onSaveNow: flush });

  async function close() {
    await flush();
    onClose();
  }

  const context = useMemo(() => ({ root, folder, assets }), [root, folder, assets]);

  if (!ready || !doc) {
    return <main className="min-h-screen grid place-items-center text-sm text-ink-400">פותח את התבנית…</main>;
  }

  return (
    <EditorContext.Provider value={context}>
      <div className="h-screen flex flex-col">
        <Toolbar status={status} onClose={close} />
        <div className="flex-1 flex min-h-0">
          <PropertiesPanel />
          <CanvasView />
          <LayerPanel />
        </div>
      </div>
    </EditorContext.Provider>
  );
}
