import { useState } from 'react';
import api from '../../services/api';
import Icon from './Icon';
import { EAT_TIMEZONE, formatApiError, getInitials } from './utils';

const CLOSED_STATUSES = ['Declined', 'Cancelled'];

const schoolDay = (value) =>
  value
    ? new Intl.DateTimeFormat('en-CA', { timeZone: EAT_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
        new Date(value)
      )
    : '';

const clockTime = (value) =>
  new Date(value).toLocaleTimeString('en-GB', { timeZone: EAT_TIMEZONE, hour: 'numeric', minute: '2-digit', hour12: true });

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
  const [tab, setTab] = useState(null);

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

  const lists = {
    expected: {
      label: 'Expected',
      visits: expected,
      empty: 'No more visitors expected today.',
      row: (visit) => renderRow(visit, { time: clockTime(visit.appointment_date), action: 'check-in', label: 'Sign in', tone: 'ad-btn-primary' }),
    },
    onsite: {
      label: 'On site',
      visits: onSite,
      empty: 'Nobody is signed in right now.',
      row: (visit) => renderRow(visit, { time: `In ${clockTime(visit.checked_in_at)}`, action: 'check-out', label: 'Sign out', tone: 'ad-btn-ghost' }),
    },
    left: {
      label: 'Left',
      visits: leftToday,
      empty: 'Nobody has signed out yet today.',
      row: (visit) => renderRow(visit, { time: `${clockTime(visit.checked_in_at)} – ${clockTime(visit.checked_out_at)}` }),
    },
  };
  /** Until the desk picks a tab, show whoever is on site, otherwise who is expected. */
  const activeTab = tab || (onSite.length ? 'onsite' : 'expected');
  const current = lists[activeTab];

  return (
    <>
      <div className="ad-page-head">
        <div>
          <h1>Gate</h1>
          <p>Today at the front desk. Sign visitors in when they arrive and out when they leave.</p>
        </div>
      </div>

      <div className="ad-stats ad-stats-3">
        <button type="button" className="ad-stat ad-stat-button" onClick={() => setTab('expected')}>
          <span>Expected today</span>
          <strong className={expected.length ? 'gold' : ''}>{expected.length}</strong>
          <small>{expected[0] ? `Next at ${clockTime(expected[0].appointment_date)}` : 'Nobody else due'}</small>
        </button>
        <button type="button" className="ad-stat ad-stat-button" onClick={() => setTab('onsite')}>
          <span>On site now</span>
          <strong>{onSite.length}</strong>
          <small>{onSite.length ? `Since ${clockTime(onSite[0].checked_in_at)}` : 'Nobody signed in'}</small>
        </button>
        <button type="button" className="ad-stat ad-stat-button" onClick={() => setTab('left')}>
          <span>Left today</span>
          <strong>{leftToday.length}</strong>
          <small>Signed out</small>
        </button>
      </div>

      <section className="ad-card">
        <div className="ad-toolbar">
          <div className="ad-segmented ad-segmented-fill ad-segmented-3" role="tablist" aria-label="Gate list">
            {Object.entries(lists).map(([id, list]) => (
              <button
                type="button"
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                className={activeTab === id ? 'active' : ''}
                onClick={() => setTab(id)}
              >
                {list.label}
                <span>{list.visits.length}</span>
              </button>
            ))}
          </div>
          <label className="ad-search">
            <Icon name="search" size={15} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a visitor or host" />
          </label>
        </div>
        <div className="ad-gate-list">
          {current.visits.map(current.row)}
          {!current.visits.length && <div className="ad-empty-line">{current.empty}</div>}
        </div>
      </section>
    </>
  );
}
