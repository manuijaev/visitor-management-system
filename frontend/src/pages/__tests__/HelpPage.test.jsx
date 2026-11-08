import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { isReceptionMode, loadSavedVisits, loadVisitorDetails, saveVisit, saveVisitorDetails } from '../../services/visitorDevice';
import HelpPage from '../HelpPage';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/help']}>
      <Routes>
        <Route path="/help" element={<HelpPage />} />
        <Route path="/" element={<p>Booking screen</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('HelpPage', () => {
  it('hides "Forget me" when nothing is saved', () => {
    renderPage();

    expect(screen.queryByText('Forget me on this phone')).toBeNull();
  });

  it('forgets the parent after confirming', () => {
    saveVisitorDetails({ name: 'Amina Hassan', phone: '0722333444', email: '' });
    saveVisit({ reference: 'GP-00001', phone: '0722333444', hostName: 'Mary', arrival: new Date().toISOString(), mode: 'now' });
    renderPage();

    expect(screen.getByText(/Saved as Amina Hassan · 1 visit saved/)).toBeTruthy();
    fireEvent.click(screen.getByText('Forget me on this phone'));
    fireEvent.click(screen.getByRole('button', { name: 'Forget me' }));

    expect(loadVisitorDetails()).toBeNull();
    expect(loadSavedVisits()).toEqual([]);
    expect(screen.queryByText('Forget me on this phone')).toBeNull();
  });

  it('turns on reception mode only after confirming, then opens booking', () => {
    renderPage();

    fireEvent.click(screen.getByText('Reception mode'));
    expect(isReceptionMode()).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }));

    expect(isReceptionMode()).toBe(true);
    expect(screen.getByText('Booking screen')).toBeTruthy();
  });
});
