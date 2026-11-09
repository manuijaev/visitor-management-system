import { useState } from 'react';
import api from '../../services/api';
import Icon from './Icon';
import { EAT_TIMEZONE, formatApiError, getInitials } from './utils';

const CLOSED_STATUSES = ['Declined', 'Cancelled', 'Expired'];

const schoolDay = (value) =>
  value
    ? new Intl.DateTimeFormat('en-CA', { timeZone: EAT_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
        new Date(value)
      )
    : '';

const clockTime = (value) =>
  new Date(value).toLocaleTimeString('en-GB', { timeZone: EAT_TIMEZONE, hour: '2-digit', minute: '2-digit' });

const matches = (visit, query) =>
  !query ||
  [visit.visitor_name, visit.visitor_phone, visit.staff_name, visit.department_name]
    .some((value) => value?.toLowerCase().includes(query));

/**
 * The gate desk: who is expected today, who is on site right now, and who has left.
 * Signing a visitor in alerts their host by SMS and push.
 */
export default function GateBoard({ appointments, onChanged, notify }) {
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);

  const today = schoolDay(new Date());
  const search = query.trim().toLowerCase();
  const visible = appointments.filter((visit) => matches(visit, search));

  const onSite = visible
    .filter((visit) => visit.checked_in_at && !visit.checked_out_at)
    .sort((a, b) => new Date(a.checked_in_at) - new Date(b.checked_in_at));
  const expected = visible
    .filter(
      (visit) =>
        !visit.checked_in_at && !CLOSED_STATUSES.includes(visit.status) && schoolDay(visit.appointment_date) === today
    )
    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
  const leftToday = visible
    .filter((visit) => visit.checked_out_at && schoolDay(visit.checked_out_at) === today)
    .sort((a, b) => new Date(b.checked_out_at) - new Date(a.checked_out_at));

  const act = async (visit, action) => {
    setBusyId(visit.id);
    try {
      await api.post(`/appointments/${visit.id}/${action}/`);
      notify(
        action === 'check-in'
          ? `${visit.visitor_name} signed in. ${visit.staff_name || 'Their host'} has been alerted.`
          : `${visit.visitor_name} signed out.`
      );
      await onChanged();
    } catch (err) {
      notify(formatApiError(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const renderRow = (visit, { time, action, label, tone }) => (
    <div key={visit.id} className="ad-gate-row">
      <span className="ad-avatar ad-avatar-gold">{getInitials(visit.visitor_name)}</span>
      <div className="ad-gate-text">
        <strong>{visit.visitor_name}</strong>
        <span>
          Seeing {visit.staff_name || 'unassigned'}
          {visit.department_name ? ` · ${visit.department_name}` : ''}
        </span>
      </div>
      <span className="ad-gate-time">{time}</span>
      {action && (
        <button
          type="button"
          className={`ad-btn ad-btn-sm ${tone}`}
          disabled={busyId === visit.id}
          onClick={() => act(visit, action)}
        >
          {busyId === visit.id ? 'Saving…' : label}
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1>Gate</h1>
          <p>Sign visitors in when they arrive and out when they leave.</p>
        </div>
        <label className="ad-search">
          <Icon name="search" size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a visitor or host" />
        </label>
      </div>

      <div className="ad-gate-grid">
        <section className="ad-card ad-gate-card is-onsite">
          <div className="ad-card-head">
            <h2>On site now</h2>
            <span className="ad-gate-count">{onSite.length}</span>
          </div>
          <div className="ad-gate-list">
            {onSite.map((visit) =>
              renderRow(visit, {
                time: `In ${clockTime(visit.checked_in_at)}`,
                action: 'check-out',
                label: 'Sign out',
                tone: 'ad-btn-ghost',
              })
            )}
            {!onSite.length && <div className="ad-empty-line">Nobody is signed in right now.</div>}
          </div>
        </section>

        <section className="ad-card ad-gate-card">
          <div className="ad-card-head">
            <h2>Expected today</h2>
            <span className="ad-gate-count">{expected.length}</span>
          </div>
          <div className="ad-gate-list">
            {expected.map((visit) =>
              renderRow(visit, {
                time: clockTime(visit.appointment_date),
                action: 'check-in',
                label: 'Sign in',
                tone: 'ad-btn-primary',
              })
            )}
            {!expected.length && <div className="ad-empty-line">No more visitors expected today.</div>}
          </div>
        </section>
      </div>

      <section className="ad-card ad-gate-card">
        <div className="ad-card-head">
          <h2>Left today</h2>
          <span className="ad-gate-count">{leftToday.length}</span>
        </div>
        <div className="ad-gate-list">
          {leftToday.map((visit) =>
            renderRow(visit, {
              time: `${clockTime(visit.checked_in_at)} – ${clockTime(visit.checked_out_at)}`,
            })
          )}
          {!leftToday.length && <div className="ad-empty-line">Nobody has signed out yet today.</div>}
        </div>
      </section>
    </>
  );
}
