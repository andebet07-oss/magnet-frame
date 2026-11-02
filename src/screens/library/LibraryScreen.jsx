// Home screen: the signed-in user's templates, from the cloud.
import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@/ui/Button';
import Icon from '@/ui/icons';
import { ConfirmDialog, NameDialog } from '@/ui/Dialog';
import { notify } from '@/ui/toast';
import { signOut } from '@/auth/useSession';
import { isNetworkError } from '@/storage/errors';
import { backupFileName, downloadBlob, exportAllTemplates, importBackup } from '@/storage/backupZip';
import TemplateCard from './TemplateCard';

const OFFLINE = 'אין חיבור לאינטרנט. נסה שוב כשהחיבור יחזור.';

export default function LibraryScreen({ repo, onOpen }) {
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [dialog, setDialog] = useState(null); // { kind: 'new' | 'rename' | 'delete', item? }
  const [backupBusy, setBackupBusy] = useState(null); // progress text while backing up or restoring
  const zipInputRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      setItems(await repo.list());
      setLoadError(null);
    } catch (err) {
      console.error('[library] listing failed:', err);
      setLoadError(isNetworkError(err) ? OFFLINE : 'לא הצלחתי לטעון את התבניות.');
    }
  }, [repo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Run a library action; on failure show `message` (or the offline message) and keep the dialog open.
  async function attempt(action, message) {
    try {
      await action();
      return true;
    } catch (err) {
      console.error(`[library] ${message}`, err);
      notify(isNetworkError(err) ? OFFLINE : message);
      return false;
    }
  }

  async function create(name) {
    let created;
    if (await attempt(async () => (created = await repo.create(name)), 'לא הצלחתי ליצור את התבנית.')) onOpen(created.id);
  }

  async function rename(item, name) {
    if (await attempt(() => repo.rename(item.id, name), 'שינוי השם נכשל.')) {
      setDialog(null);
      await refresh();
    }
  }

  async function remove(item) {
    if (await attempt(() => repo.remove(item.id), 'המחיקה נכשלה.')) {
      setDialog(null);
      await refresh();
    }
  }

  async function exportZip() {
    setBackupBusy('מכין גיבוי…');
    await attempt(async () => {
      const { blob, count } = await exportAllTemplates(repo, { onProgress: (done, total) => setBackupBusy(`מגבה ${done}/${total}…`) });
      downloadBlob(blob, backupFileName());
      notify(`הגיבוי ירד למחשב: ${count} תבניות בקובץ ZIP אחד.`, 'info');
    }, 'הגיבוי נכשל.');
    setBackupBusy(null);
  }

  async function importZip(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBackupBusy('קורא את הגיבוי…');
    await attempt(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { imported, failed } = await importBackup(repo, bytes, { onProgress: (done, total) => setBackupBusy(`משחזר ${done}/${total}…`) });
      if (!imported && !failed.length) notify('לא נמצאו תבניות בקובץ הזה.');
      else if (failed.length) notify(`שוחזרו ${imported} תבניות. ${failed.length} לא נקראו: ${failed.map((f) => f.folder).join(', ')}`);
      else notify(`שוחזרו ${imported} תבניות, כעותקים חדשים.`, 'info');
      await refresh();
    }, 'השחזור נכשל. ודא שזה קובץ ZIP של גיבוי מהכלי.');
    setBackupBusy(null);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-ink-700 bg-ink-900">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-4 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold flex-1">תבניות</h1>
          <Button variant="ghost" onClick={() => attempt(signOut, 'ההתנתקות נכשלה. נסה שוב.')}>
            התנתקות
          </Button>
          {backupBusy ? (
            <span className="text-sm text-ink-200" role="status">
              {backupBusy}
            </span>
          ) : (
            <>
              <Button variant="ghost" onClick={exportZip} disabled={!items?.length} title="הורדת כל התבניות כקובץ ZIP אחד">
                גיבוי ZIP
              </Button>
              <Button variant="ghost" onClick={() => zipInputRef.current.click()} title="הוספת התבניות מקובץ גיבוי, כעותקים חדשים">
                שחזור מגיבוי
              </Button>
            </>
          )}
          <input ref={zipInputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={importZip} />
          <Button variant="primary" onClick={() => setDialog({ kind: 'new' })}>
            <Icon name="plus" />
            תבנית חדשה
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 md:px-8 py-6">
        {loadError && (
          <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-danger-500/50 bg-danger-500/10 px-4 py-3">
            <p className="flex-1 text-sm">{loadError}</p>
            <Button onClick={refresh}>נסה שוב</Button>
          </div>
        )}
        {items === null && !loadError && <p className="text-ink-400 text-sm">טוען…</p>}
        {items?.length === 0 && (
          <div className="rounded-xl border border-dashed border-ink-600 py-16 text-center">
            <p className="text-ink-200 mb-4">אין עדיין תבניות.</p>
            <Button variant="primary" onClick={() => setDialog({ kind: 'new' })}>
              יצירת התבנית הראשונה
            </Button>
          </div>
        )}
        {items?.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <TemplateCard
                key={item.id}
                item={item}
                onOpen={() => onOpen(item.id)}
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
          initial={dialog.item.name}
          confirmLabel="שמירה"
          onSubmit={(name) => rename(dialog.item, name)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="מחיקת תבנית"
          message={`התבנית «${dialog.item.name}» והתמונות שלה יימחקו. אי אפשר לבטל את זה.`}
          confirmLabel="מחיקה"
          onConfirm={() => remove(dialog.item)}
          onClose={() => setDialog(null)}
        />
      )}
    </main>
  );
}
