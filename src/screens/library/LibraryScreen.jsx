// Home screen: every template in the chosen folder.
import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@/ui/Button';
import Icon from '@/ui/icons';
import { ConfirmDialog, NameDialog } from '@/ui/Dialog';
import { notify } from '@/ui/toast';
import { pickFolder } from '@/storage/libraryFolder';
import { signOut } from '@/auth/useSession';
import { createTemplate, deleteTemplate, listTemplates, renameTemplate } from '@/storage/templateRepo';
import TemplateCard from './TemplateCard';

const revokeThumbnails = (items) => items?.forEach((i) => i.thumbnailUrl && URL.revokeObjectURL(i.thumbnailUrl));

export default function LibraryScreen({ root, onOpen, onChangeRoot }) {
  const [items, setItems] = useState(null);
  const [dialog, setDialog] = useState(null); // { kind: 'new' | 'rename' | 'delete', item? }
  const itemsRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const list = await listTemplates(root);
      revokeThumbnails(itemsRef.current);
      itemsRef.current = list;
      setItems(list);
    } catch (err) {
      console.error('[library] listing failed:', err);
      notify('לא הצלחתי לקרוא את תיקיית התבניות.');
      setItems([]);
    }
  }, [root]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => () => revokeThumbnails(itemsRef.current), []);

  async function create(name) {
    try {
      const { folder } = await createTemplate(root, name);
      onOpen(folder);
    } catch (err) {
      console.error('[library] create failed:', err);
      notify('לא הצלחתי ליצור את התבנית.');
    }
  }

  async function rename(item, name) {
    try {
      await renameTemplate(root, item.folder, name);
      setDialog(null);
      await refresh();
    } catch (err) {
      console.error('[library] rename failed:', err);
      notify('שינוי השם נכשל.');
    }
  }

  async function remove(item) {
    try {
      await deleteTemplate(root, item.folder);
      setDialog(null);
      await refresh();
    } catch (err) {
      console.error('[library] delete failed:', err);
      notify('המחיקה נכשלה.');
    }
  }

  async function changeFolder() {
    try {
      onChangeRoot(await pickFolder());
    } catch (err) {
      if (err.name !== 'AbortError') notify('לא הצלחתי לפתוח את התיקייה.');
    }
  }

  async function leave() {
    try {
      await signOut();
    } catch (err) {
      console.error('[library] sign-out failed:', err);
      notify('ההתנתקות נכשלה. נסה שוב.');
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-ink-700 bg-ink-900">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-4 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold flex-1">תבניות</h1>
          <Button variant="ghost" onClick={leave}>
            התנתקות
          </Button>
          <Button variant="ghost" onClick={changeFolder} title="החלפת תיקייה">
            <Icon name="folder" />
            {root.name}
          </Button>
          <Button variant="primary" onClick={() => setDialog({ kind: 'new' })}>
            <Icon name="plus" />
            תבנית חדשה
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 md:px-8 py-6">
        {items === null && <p className="text-ink-400 text-sm">טוען…</p>}
        {items?.length === 0 && (
          <div className="rounded-xl border border-dashed border-ink-600 py-16 text-center">
            <p className="text-ink-200 mb-4">אין עדיין תבניות בתיקייה הזו.</p>
            <Button variant="primary" onClick={() => setDialog({ kind: 'new' })}>
              יצירת התבנית הראשונה
            </Button>
          </div>
        )}
        {items?.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <TemplateCard
                key={item.folder}
                item={item}
                onOpen={() => onOpen(item.folder)}
                onRename={() => setDialog({ kind: 'rename', item })}
                onDelete={() => setDialog({ kind: 'delete', item })}
              />
            ))}
          </div>
        )}
      </section>

      {dialog?.kind === 'new' && (
        <NameDialog title="תבנית חדשה" initial="תבנית חדשה" confirmLabel="יצירה" onSubmit={create} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'rename' && (
        <NameDialog
          title="שינוי שם"
          initial={dialog.item.doc.name}
          confirmLabel="שמירה"
          onSubmit={(name) => rename(dialog.item, name)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="מחיקת תבנית"
          message={`התבנית «${dialog.item.doc.name}» והקבצים שלה יימחקו מהתיקייה. אי אפשר לבטל את זה.`}
          confirmLabel="מחיקה"
          onConfirm={() => remove(dialog.item)}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  );
}
