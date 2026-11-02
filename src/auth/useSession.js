// Current sign-in state: { status: 'loading' | 'signedOut' | 'signedIn', user, error }.
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authErrorFromUrl, authErrorMessage, cleanAuthParams } from './authErrors';

const LOADING = { status: 'loading', user: null, error: null };

function stateFor(user, error = null) {
  return { status: user ? 'signedIn' : 'signedOut', user: user ?? null, error };
}

export function useSession() {
  const [state, setState] = useState(LOADING);

  useEffect(() => {
    let alive = true;
    // Only re-render when who is signed in actually changes (token refreshes don't count).
    const apply = (next) =>
      setState((prev) => (prev.status === next.status && prev.user?.id === next.user?.id && prev.error === next.error ? prev : next));

    (async () => {
      // A failed sign-in link comes back with its error in the address bar.
      const urlError = authErrorFromUrl(window.location.href);
      const hadCode = new URL(window.location.href).searchParams.has('code');
      // initialize() finishes reading a returning sign-in link and reports what went wrong.
      const { error: initError } = await supabase.auth.initialize();
      const { data, error: sessionError } = await supabase.auth.getSession();
      // A link opened in another browser is ignored by Supabase (no PKCE verifier here): say so.
      const wrongBrowser = hadCode && !data?.session ? { code: 'flow_state_not_found' } : null;
      const problem = urlError ?? initError ?? sessionError ?? wrongBrowser;
      if (problem) console.error('[auth] sign-in did not complete:', problem.message ?? problem.code);
      if (urlError || initError || hadCode) window.history.replaceState(null, '', cleanAuthParams(window.location.href));
      if (alive) apply(stateFor(data?.session?.user, problem ? authErrorMessage(problem) : null));
    })();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive || event === 'INITIAL_SESSION') return;
      apply(stateFor(session?.user));
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
