import { describe, expect, it } from 'vitest';
import {
  forgetVisitor,
  isReceptionMode,
  loadSavedVisits,
  loadVisitorDetails,
  saveVisit,
  saveVisitorDetails,
  setReceptionMode,
} from './visitorDevice';

const visit = (reference, extra = {}) => ({
  reference,
  phone: '0722333444',
  hostName: 'Mary Wanjiru',
  arrival: '2026-11-10T07:00:00.000Z',
  mode: 'later',
  ...extra,
});

describe('visitor details', () => {
  it('starts empty', () => {
    expect(loadVisitorDetails()).toBeNull();
  });

  it('saves trimmed details', () => {
    saveVisitorDetails({ name: '  Amina Hassan ', phone: ' 0722 333 444 ', email: '' });

    expect(loadVisitorDetails()).toEqual({ name: 'Amina Hassan', phone: '0722 333 444', email: '' });
  });

  it('ignores corrupt or incomplete storage', () => {
    localStorage.setItem('gp_visitor_details', '{not json');
    expect(loadVisitorDetails()).toBeNull();

    localStorage.setItem('gp_visitor_details', JSON.stringify({ name: 'Amina' }));
    expect(loadVisitorDetails()).toBeNull();
  });
});

describe('saved visits', () => {
  it('puts the newest visit first', () => {
    saveVisit(visit('GP-00001'));
    saveVisit(visit('GP-00002'));

    expect(loadSavedVisits().map((item) => item.reference)).toEqual(['GP-00002', 'GP-00001']);
  });

  it('replaces a visit saved twice instead of duplicating it', () => {
    saveVisit(visit('GP-00001', { hostName: 'Old' }));
    saveVisit(visit('GP-00001', { hostName: 'New' }));

    expect(loadSavedVisits()).toHaveLength(1);
    expect(loadSavedVisits()[0].hostName).toBe('New');
  });

  it('keeps only the 20 most recent', () => {
    for (let i = 1; i <= 25; i += 1) saveVisit(visit(`GP-${String(i).padStart(5, '0')}`));

    const saved = loadSavedVisits();
    expect(saved).toHaveLength(20);
    expect(saved[0].reference).toBe('GP-00025');
  });

  it('drops entries without a reference or phone', () => {
    localStorage.setItem('gp_visitor_visits', JSON.stringify([visit('GP-00001'), { reference: 'GP-00002' }, null]));

    expect(loadSavedVisits().map((item) => item.reference)).toEqual(['GP-00001']);
  });
});

describe('forgetVisitor', () => {
  it('clears details and visits but not reception mode', () => {
    saveVisitorDetails({ name: 'Amina', phone: '0722333444', email: '' });
    saveVisit(visit('GP-00001'));
    setReceptionMode(true);

    forgetVisitor();

    expect(loadVisitorDetails()).toBeNull();
    expect(loadSavedVisits()).toEqual([]);
    expect(isReceptionMode()).toBe(true);
  });
});

describe('reception mode', () => {
  it('is off by default and can be toggled', () => {
    expect(isReceptionMode()).toBe(false);
    setReceptionMode(true);
    expect(isReceptionMode()).toBe(true);
    setReceptionMode(false);
    expect(isReceptionMode()).toBe(false);
  });
});
