// First screen: choose the library folder, or re-allow access to the one chosen before.
import { useEffect, useState } from 'react';
import Button from '@/ui/Button';
import Icon from '@/ui/icons';
import { notify } from '@/ui/toast';
import { getSavedFolder, hasPermission, isFolderAccessSupported, pickFolder, requestPermission } from '@/storage/libraryFolder';

export default function FolderGate({ onReady }) {
  const [saved, setSaved] = useState(undefined); // undefined while checking, null when none

  useEffect(() => {
    if (!isFolderAccessSupported()) return undefined;
    let alive = true;
    (async () => {
      try {
        const handle = await getSavedFolder();
        if (!alive) return;
        if (handle && (await hasPermission(handle))) onReady(handle);
        else setSaved(handle);
      } catch (err) {
        console.error('[folder] could not restore the saved folder:', err);
        if (alive) setSaved(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [onReady]);

  async function resume() {
    try {
      if (await requestPermission(saved)) onReady(saved);
      else notify('בלי הרשאה לתיקייה אי אפשר לפתוח את התבניות.');
    } catch (err) {
      console.error('[folder] permission request failed:', err);
      notify('התיקייה לא נמצאה. אפשר לבחור אותה שוב.');
      setSaved(null);
    }
  }

  async function choose() {
    try {
      onReady(await pickFolder());
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('[folder] pick failed:', err);
      notify('לא הצלחתי לפתוח את התיקייה. נסה שוב.');
    }
  }

  if (!isFolderAccessSupported()) {
    return (
      <Shell>
        <p className="text-ink-200">הכלי עובד רק ב-Chrome או ב-Edge במחשב. רק בהם דף אינטרנט יכול לשמור קבצים בתיקייה שבחרת.</p>
      </Shell>
    );
  }
  if (saved === undefined) return <Shell />;

  return (
    <Shell>
      <p className="text-ink-200 leading-relaxed">התבניות נשמרות כקבצים בתיקייה במחשב שלך. שום דבר לא נשלח לשרת.</p>
      <div className="flex flex-col gap-2">
        {saved && (
          <Button variant="primary" className="h-11" onClick={resume}>
            <Icon name="folder" />
            המשך עם התיקייה «{saved.name}»
          </Button>
        )}
        <Button variant={saved ? 'secondary' : 'primary'} className="h-11" onClick={choose}>
          {saved ? 'בחירת תיקייה אחרת' : 'בחירת תיקייה לתבניות'}
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <p className="text-sm text-accent-400 mb-1">כלי אישי</p>
          <h1 className="text-2xl font-bold">סטודיו מסגרות למגנטים</h1>
        </div>
        {children}
      </div>
    </main>
  );
}
