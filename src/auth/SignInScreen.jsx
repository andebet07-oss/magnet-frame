// Sign in with a one-time link sent by email. No passwords.
import { useState } from 'react';
import Button from '@/ui/Button';
import { supabase } from '@/lib/supabase';
import { authErrorMessage } from './authErrors';

export default function SignInScreen({ initialError = null }) {
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState(initialError);
  const trimmed = email.trim();

  async function submit(e) {
    e.preventDefault();
    if (!trimmed || phase === 'sending') return;
    setPhase('sending');
    setError(null);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (otpError) throw otpError;
      setPhase('sent');
    } catch (err) {
      console.error('[auth] sending the sign-in link failed:', err.code ?? err.message);
      setError(authErrorMessage(err));
      setPhase('idle');
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <p className="text-sm text-accent-400 mb-1">כלי אישי</p>
          <h1 className="text-2xl font-bold">סטודיו מסגרות למגנטים</h1>
        </div>

        {phase === 'sent' ? (
          <div className="flex flex-col gap-4" role="status">
            <p className="text-ink-50 leading-relaxed">
              שלחנו קישור כניסה אל <span dir="ltr" className="font-semibold">{trimmed}</span>.
            </p>
            <p className="text-sm text-ink-200 leading-relaxed">פתח את המייל ולחץ על הקישור בדפדפן הזה. אם הוא לא הגיע תוך דקה, בדוק בתיקיית הספאם.</p>
            <Button variant="ghost" className="self-start" onClick={() => setPhase('idle')}>
              שליחה מחדש או מייל אחר
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-ink-200">מייל</span>
              <input
                type="email"
                dir="ltr"
                required
                autoFocus
                autoComplete="email"
                className="h-11 rounded-md bg-ink-850 border border-ink-700 px-3 text-sm focus:outline-none focus:border-accent-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <Button variant="primary" type="submit" className="h-11" disabled={!trimmed || phase === 'sending'}>
              {phase === 'sending' ? 'שולח…' : 'שלחו לי קישור כניסה'}
            </Button>
            <p className="text-xs text-ink-400 leading-relaxed">התבניות נשמרות בענן ושייכות רק לך. אחרי הכניסה הדפדפן זוכר אותך.</p>
          </form>
        )}

        {error && (
          <p role="alert" className="rounded-md border border-danger-500/50 bg-danger-500/10 px-3 py-2 text-sm text-ink-50">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
