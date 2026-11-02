// Turns Supabase Auth errors into short Hebrew messages for the sign-in screen.

const BY_CODE = {
  over_email_send_rate_limit: 'נשלחו יותר מדי קישורים בשעה האחרונה. נסה שוב מאוחר יותר.',
  over_request_rate_limit: 'אפשר לבקש קישור חדש פעם בדקה. נסה שוב עוד רגע.',
  email_address_not_authorized: 'אפשר להיכנס רק עם המייל של חשבון ה-Supabase של הכלי.',
  email_address_invalid: 'כתובת המייל לא תקינה.',
  validation_failed: 'כתובת המייל לא תקינה.',
  signup_disabled: 'המייל הזה לא רשום בכלי.',
  otp_disabled: 'המייל הזה לא רשום בכלי.',
  otp_expired: 'הקישור פג תוקף או שכבר השתמשו בו. שלח קישור חדש.',
  flow_state_not_found: 'פתח את הקישור באותו דפדפן שבו ביקשת אותו, או שלח קישור חדש.',
  flow_state_expired: 'הקישור פג תוקף. שלח קישור חדש.',
  bad_code_verifier: 'פתח את הקישור באותו דפדפן שבו ביקשת אותו, או שלח קישור חדש.',
};

const NETWORK = 'אין חיבור לאינטרנט. בדוק את החיבור ונסה שוב.';
const FALLBACK = 'הכניסה נכשלה. נסה שוב.';

/** @param err  AuthError-like: { code?, status?, name?, message? } */
export function authErrorMessage(err) {
  if (!err) return null;
  const code = err.code ?? err.error_code;
  if (code && BY_CODE[code]) return BY_CODE[code];
  if (err.name === 'AuthRetryableFetchError' || err instanceof TypeError || /fetch|network/i.test(err.message ?? '')) return NETWORK;
  if (/code verifier/i.test(err.message ?? '')) return BY_CODE.bad_code_verifier;
  if (/expired|invalid/i.test(err.message ?? '') && /link|otp|token/i.test(err.message ?? '')) return BY_CODE.otp_expired;
  if (err.status === 429) return BY_CODE.over_email_send_rate_limit;
  return FALLBACK;
}

/** Error that Supabase put in the address bar after a failed sign-in link (query or hash). */
export function authErrorFromUrl(href) {
  const url = new URL(href);
  const params = new URLSearchParams(url.search);
  new URLSearchParams(url.hash.replace(/^#/, '')).forEach((v, k) => params.set(k, v));
  if (!params.get('error') && !params.get('error_code')) return null;
  return { code: params.get('error_code') ?? params.get('error'), message: params.get('error_description') ?? '' };
}

/** The address without Supabase's error or code parameters, for history.replaceState. */
export function cleanAuthParams(href) {
  const url = new URL(href);
  for (const key of ['error', 'error_code', 'error_description', 'code']) url.searchParams.delete(key);
  if (/error|access_token/.test(url.hash)) url.hash = '';
  return url.toString();
}
