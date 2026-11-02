import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from '@/auth/useSession';
import SignInScreen from '@/auth/SignInScreen';
import { supabase } from '@/lib/supabase';
import { createCloudRepo } from '@/storage/cloudRepo';
import { createSupabaseGateway } from '@/storage/supabaseGateway';
import LibraryScreen from '@/screens/library/LibraryScreen';
import EditorScreen from '@/screens/editor/EditorScreen';
import Toasts from '@/ui/Toasts';

// Local demo: `npm run dev`, then open /?demo. No sign-in, templates kept in memory only.
// import.meta.env.DEV is false in the built site, so none of this ships.
const DEMO = import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo');
const DEMO_USER = '00000000-0000-4000-8000-00000000de00';

function useDemoRepo() {
  const [repo, setRepo] = useState(null);
  useEffect(() => {
    if (!DEMO) return;
    import('@/storage/memoryGateway').then(({ createMemoryGateway }) => setRepo(createCloudRepo(createMemoryGateway(), DEMO_USER)));
  }, []);
  return repo;
}

export default function App() {
  const session = useSession();
  const demoRepo = useDemoRepo();
  const userId = DEMO ? DEMO_USER : (session.user?.id ?? null);
  const cloudRepo = useMemo(() => (userId && !DEMO ? createCloudRepo(createSupabaseGateway(supabase), userId) : null), [userId]);
  const repo = DEMO ? demoRepo : cloudRepo;
  // The open template belongs to whoever opened it; a different sign-in starts at the library.
  const [open, setOpen] = useState(null); // { userId, templateId }
  const openTemplate = useCallback((templateId) => setOpen({ userId, templateId }), [userId]);
  const closeEditor = useCallback(() => setOpen(null), []);
  const templateId = open?.userId === userId ? open.templateId : null;

  let screen;
  if (DEMO ? !repo : session.status === 'loading') screen = <main className="min-h-screen" aria-busy="true" />;
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
