import { describe, expect, it } from 'vitest';
import { hasUsableSession, isTokenExpired, isValidUser, readStoredUser } from './session';

const token = (secondsFromNow) => {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + secondsFromNow }));
  return `header.${payload}.signature`;
};

describe('isTokenExpired', () => {
  it('accepts a token with time left', () => {
    expect(isTokenExpired(token(3600))).toBe(false);
  });

  it('treats a token about to expire as expired', () => {
    expect(isTokenExpired(token(10))).toBe(true);
  });

  it('treats missing or malformed tokens as expired', () => {
    expect(isTokenExpired(null)).toBe(true);
    expect(isTokenExpired('garbage')).toBe(true);
  });
});

describe('stored user', () => {
  it('only accepts users with an id and a known role', () => {
    expect(isValidUser({ id: 1, role: 'Staff' })).toBe(true);
    expect(isValidUser({ id: 1, role: 'Visitor' })).toBe(false);
    expect(isValidUser({ role: 'Admin' })).toBe(false);
  });

  it('needs a valid user and a live refresh token to resume', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'Admin' }));
    localStorage.setItem('refresh_token', token(3600));
    expect(readStoredUser()).toEqual({ id: 1, role: 'Admin' });
    expect(hasUsableSession()).toBe(true);

    localStorage.setItem('refresh_token', token(-60));
    expect(hasUsableSession()).toBe(false);
  });
});
