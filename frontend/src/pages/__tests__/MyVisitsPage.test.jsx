import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '../../services/api';
import { saveVisit } from '../../services/visitorDevice';
import MyVisitsPage from '../MyVisitsPage';

vi.mock('../../services/api', () => ({ default: { post: vi.fn(), get: vi.fn() } }));

const hoursFromNow = (hours) => new Date(Date.now() + hours * 3600 * 1000).toISOString();

const renderPage = () =>
  render(
    <MemoryRouter>
      <MyVisitsPage />
    </MemoryRouter>
  );

describe('MyVisitsPage', () => {
  beforeEach(() => {
    api.post.mockReset();
  });

  it('invites the parent to book when nothing is saved', () => {
    renderPage();

    expect(screen.getByText('No visits yet')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Book a visit' }).getAttribute('href')).toBe('/');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows each saved visit with its live status', async () => {
    saveVisit({ reference: 'GP-00007', phone: '0722333444', hostName: 'Mary Wanjiru', arrival: hoursFromNow(24), mode: 'later' });
    api.post.mockResolvedValue({
      data: { reference: 'GP-00007', status: 'Accepted', staff_name: 'Mary Wanjiru', appointment_date: hoursFromNow(24) },
    });

    renderPage();

    expect(await screen.findByText('Confirmed')).toBeTruthy();
    expect(screen.getByText('GP-00007')).toBeTruthy();
    expect(api.post).toHaveBeenCalledWith('/visits/lookup/', { reference: 'GP-00007', phone: '0722333444' });
  });

  it('lists upcoming visits before past ones', () => {
    saveVisit({ reference: 'GP-00001', phone: '0722333444', hostName: 'Past Teacher', arrival: hoursFromNow(-24 * 10), mode: 'now' });
    saveVisit({ reference: 'GP-00002', phone: '0722333444', hostName: 'Next Teacher', arrival: hoursFromNow(48), mode: 'later' });
    api.post.mockReturnValue(new Promise(() => {}));

    renderPage();

    const names = screen.getAllByRole('button').map((card) => card.querySelector('strong')?.textContent);
    expect(names).toEqual(['Next Teacher', 'Past Teacher']);
    expect(screen.getByText('Past')).toBeTruthy();
  });

  it('only looks up recent visits', () => {
    saveVisit({ reference: 'GP-00001', phone: '0722333444', hostName: 'Old', arrival: hoursFromNow(-24 * 10), mode: 'now' });

    renderPage();

    expect(api.post).not.toHaveBeenCalled();
  });

  it('stops showing "Checking…" when a lookup fails', async () => {
    saveVisit({ reference: 'GP-00009', phone: '0722333444', hostName: 'Mary Wanjiru', arrival: hoursFromNow(5), mode: 'later' });
    api.post.mockRejectedValue(new Error('offline'));

    renderPage();

    expect(await screen.findByText('View')).toBeTruthy();
    expect(screen.queryByText('Checking…')).toBeNull();
  });
});
