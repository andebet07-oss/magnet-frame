// Frame editor: properties (right), canvas (centre), layers (left).
import { useEffect, useMemo, useState } from 'react';
import { notify } from '@/ui/toast';
import { createAssetCache } from '@/storage/assetCache';
import { isNetworkError } from '@/storage/errors';
import { useDoc, useEditor } from '@/store/editorStore';
import { EditorContext } from './EditorContext';
import { useEditorKeys } from './hooks';
import { useCloudSync } from './useCloudSync';
import CanvasView from './CanvasView';
import LayerPanel from './LayerPanel';
import PropertiesPanel from './PropertiesPanel';
import Toolbar from './Toolbar';

export default function EditorScreen({ repo, templateId, onClose }) {
  const [revision, setRevision] = useState(undefined); // revision that was loaded; undefined while loading
  const assets = useMemo(() => createAssetCache((path) => repo.readAsset(templateId, path)), [repo, templateId]);
  const doc = useDoc();

  useEffect(() => {
    let alive = true;
    repo
      .load(templateId)
      .then((loaded) => {
        if (!alive) return;
        useEditor.getState().open(loaded.doc);
        setRevision(loaded.revision);
      })
      .catch((err) => {
        console.error('[editor] could not open template:', err);
        notify(isNetworkError(err) ? 'אין חיבור לאינטרנט, אז אי אפשר לפתוח את התבנית כרגע.' : 'לא הצלחתי לפתוח את התבנית.');
        onClose();
      });
    return () => {
      alive = false;
      useEditor.getState().close();
    };
  }, [repo, templateId, onClose]);

  const sync = useCloudSync({ repo, templateId, revision, assets });
  useEditorKeys({ onSaveNow: sync.flush });

  async function close() {
    await sync.flush();
    onClose();
  }

  const context = useMemo(() => ({ repo, templateId, assets }), [repo, templateId, assets]);

  if (revision === undefined || !doc) {
    return <main className="min-h-screen grid place-items-center text-sm text-ink-400">פותח את התבנית…</main>;
  }

  return (
    <EditorContext.Provider value={context}>
      <div className="h-screen flex flex-col">
        <Toolbar status={sync.status} onClose={close} />
        <div className="flex-1 flex min-h-0">
          <PropertiesPanel />
          <CanvasView />
          <LayerPanel />
        </div>
      </div>
    </EditorContext.Provider>
  );
}
