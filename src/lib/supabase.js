// The one Supabase client for the app.
import { createClient } from '@supabase/supabase-js';

// Public values. The publishable key only identifies the project; it grants nothing by itself.
// Access is enforced by row level security in the database (supabase/migrations), which is why
// these can live in the code that ships to the browser.
export const SUPABASE_URL = 'https://gelzopnjdlucizxpootg.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_766WwcUugyofSGnADe2K4A_tVdK2zEz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // PKCE: the sign-in link only works in the browser that asked for it,
    // and no tokens ever appear in the address bar.
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
