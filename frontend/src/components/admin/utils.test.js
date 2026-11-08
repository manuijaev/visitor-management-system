import { describe, expect, it } from 'vitest';
import { eatDateKey, formatApiError, getInitials } from './utils';

describe('eatDateKey', () => {
  it('uses the school day in Nairobi, not UTC', () => {
    // 22:30 UTC on the 9th is already 01:30 on the 10th in Nairobi.
    expect(eatDateKey('2026-11-09T22:30:00Z')).toBe('2026-11-10');
    expect(eatDateKey('2026-11-09T20:59:00Z')).toBe('2026-11-09');
  });

  it('returns an empty string for an invalid date', () => {
    expect(eatDateKey('not a date')).toBe('');
  });
});

describe('formatApiError', () => {
  it('prefers the detail message', () => {
    expect(formatApiError({ response: { data: { detail: 'Not allowed.' } } })).toBe('Not allowed.');
  });

  it('joins field errors', () => {
    const err = { response: { data: { appointment_date: ['Pick a new time.'], response_note: ['Add a note.'] } } };
    expect(formatApiError(err)).toBe('Pick a new time. Add a note.');
  });

  it('falls back when there is no usable message', () => {
    expect(formatApiError({}, 'Offline')).toBe('Offline');
    expect(formatApiError({ response: { data: '<html>500</html>' } }, 'Offline')).toBe('Offline');
  });
});

describe('getInitials', () => {
  it('uses up to two initials', () => {
    expect(getInitials('Mary Wanjiru Kamau')).toBe('MW');
    expect(getInitials('')).toBe('?');
  });
});
