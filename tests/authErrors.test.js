import { describe, expect, it } from 'vitest';
import { authErrorFromUrl, authErrorMessage, cleanAuthParams, sessionTokensFromUrl } from '@/auth/authErrors';

describe('authErrorMessage', () => {
  it('maps Supabase error codes to Hebrew', () => {
    expect(authErrorMessage({ code: 'over_email_send_rate_limit', status: 429 })).toMatch(/יותר מדי/);
    expect(authErrorMessage({ code: 'email_address_not_authorized' })).toMatch(/Supabase/);
    expect(authErrorMessage({ code: 'otp_expired' })).toMatch(/פג תוקף/);
  });

  it('recognises network failures and PKCE problems by message', () => {
    expect(authErrorMessage(new TypeError('Failed to fetch'))).toMatch(/אין חיבור/);
    expect(authErrorMessage({ name: 'AuthRetryableFetchError', message: '' })).toMatch(/אין חיבור/);
    expect(authErrorMessage({ message: 'PKCE code verifier not found in storage.' })).toMatch(/אותו דפדפן/);
  });

  it('falls back to a generic message, and returns null for no error', () => {
    expect(authErrorMessage({ message: 'something odd' })).toBe('הכניסה נכשלה. נסה שוב.');
    expect(authErrorMessage(null)).toBeNull();
  });
});

describe('sign-in link errors in the address bar', () => {
  it('reads them from the query string or the hash', () => {
    expect(authErrorFromUrl('https://x.app/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid')).toEqual({
      code: 'otp_expired',
      message: 'Email link is invalid',
    });
    expect(authErrorFromUrl('https://x.app/#error=access_denied&error_code=otp_expired')?.code).toBe('otp_expired');
    expect(authErrorFromUrl('https://x.app/')).toBeNull();
  });

  it('cleans them out of the address', () => {
    expect(cleanAuthParams('https://x.app/?error=a&error_code=b&error_description=c&keep=1')).toBe('https://x.app/?keep=1');
    expect(cleanAuthParams('https://x.app/?code=123')).toBe('https://x.app/');
    expect(cleanAuthParams('https://x.app/#error=a')).toBe('https://x.app/');
  });
});

describe('links sent from the Supabase dashboard', () => {
  it('reads the session they carry in the hash', () => {
    expect(sessionTokensFromUrl('https://x.app/#access_token=aaa&expires_in=3600&refresh_token=rrr&token_type=bearer&type=signup')).toEqual({
      access_token: 'aaa',
      refresh_token: 'rrr',
    });
  });

  it('ignores addresses without a full session, or with an error', () => {
    expect(sessionTokensFromUrl('https://x.app/')).toBeNull();
    expect(sessionTokensFromUrl('https://x.app/?code=123')).toBeNull();
    expect(sessionTokensFromUrl('https://x.app/#access_token=aaa')).toBeNull();
    expect(sessionTokensFromUrl('https://x.app/#error=x&access_token=a&refresh_token=b')).toBeNull();
  });
});
