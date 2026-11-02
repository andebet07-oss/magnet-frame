import { useCallback, useMemo, useState } from 'react';
import { useSession } from '@/auth/useSession';
import SignInScreen from '@/auth/SignInScreen';
import { supabase } from '@/lib/supabase';
import { createCloudRepo } from '@/storage/cloudRepo';
import { createSupabaseGateway } from '@/storage/supabaseGateway';
import LibraryScreen from '@/screens/library/LibraryScreen';
import EditorScreen from '@/screens/editor/EditorScreen';
import Toasts from '@/ui/Toasts';

export default function App() {
  const session = useSession();
  const userId = session.user?.id ?? null;
  const repo = useMemo(() => (userId ? createCloudRepo(createSupabaseGateway(supabase), userId) : null), [userId]);
  // The open template belongs to whoever opened it; a different sign-in starts at the library.
  const [open, setOpen] = useState(null); // { userId, templateId }
  const openTemplate = useCallback((templateId) => setOpen({ userId, templateId }), [userId]);
  const closeEditor = useCallback(() => setOpen(null), []);
  const templateId = open?.userId === userId ? open.templateId : null;

  let screen;
  if (session.status === 'loading') screen = <main className="min-h-screen" aria-busy="true" />;
  else if (!repo) screen = <SignInScreen initialError={session.error} />;
  else if (templateId) screen = <EditorScreen key={templateId} repo={repo} templateId={templateId} onClose={closeEditor} />;
  else screen = <LibraryScreen repo={repo} onOpen={openTemplate} />;

  return (
    <>
      {screen}
      <Toasts />
    </>
  );
}
