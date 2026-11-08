import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import AppShell from '../components/visitor/AppShell';
import Icon from '../components/visitor/Icon';
import { loadSavedVisits } from '../services/visitorDevice';

const TZ = 'Africa/Nairobi';
/** Only recent and upcoming visits are refreshed, to stay well inside the lookup rate limit. */
const REFRESH_LIMIT = 6;
const RECENT_MS = 2 * 24 * 60 * 60 * 1000;

const STATUS_TONE = {
  Pending: 'wait',
  Accepted: 'ok',
  Rescheduled: 'wait',
  Declined: 'stop',
  Cancelled: 'stop',
  Expired: 'stop',
};

const STATUS_LABEL = {
  Pending: 'Waiting for reply',
  Accepted: 'Confirmed',
  Rescheduled: 'New time',
  Declined: 'Declined',
  Cancelled: 'Cancelled',
  Expired: 'Closed',
};

const formatWhen = (value) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value));

const isRecent = (visit) => new Date(visit.arrival).getTime() > Date.now() - RECENT_MS;

/**
 * The parent's visits booked from this phone. Statuses come from the visit lookup endpoint,
 * using the reference and phone number saved when they booked.
 */
export default function MyVisitsPage() {
  const navigate = useNavigate();
  const [visits] = useState(loadSavedVisits);
  const [live, setLive] = useState({});

  useEffect(() => {
    let active = true;
    visits
      .filter(isRecent)
      .slice(0, REFRESH_LIMIT)
      .forEach((visit) => {
        api
          .post('/visits/lookup/', { reference: visit.reference, phone: visit.phone })
          .then(({ data }) => active && setLive((current) => ({ ...current, [visit.reference]: data })))
          .catch(() => active && setLive((current) => ({ ...current, [visit.reference]: { unavailable: true } })));
      });
    return () => {
      active = false;
    };
  }, [visits]);

  const rows = visits
    .map((visit) => {
      const server = live[visit.reference];
      return {
        ...visit,
        arrival: server?.appointment_date || visit.arrival,
        hostName: server?.staff_name || visit.hostName,
        status: server?.status || null,
        checking: !server && isRecent(visit),
      };
    })
    .sort((a, b) => {
      const aUpcoming = new Date(a.arrival) > Date.now();
      const bUpcoming = new Date(b.arrival) > Date.now();
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      return aUpcoming ? new Date(a.arrival) - new Date(b.arrival) : new Date(b.arrival) - new Date(a.arrival);
    });

  const openVisit = (visit) =>
    navigate(`/visit?ref=${encodeURIComponent(visit.reference)}`, { state: { phone: visit.phone } });

  return (
    <AppShell title="My visits">
      <section className="gp-screen">
        <header className="gp-screen-head">
          <h1>My visits</h1>
          <p>Visits booked on this phone. Tap one to see details or cancel it.</p>
        </header>

        {rows.length === 0 ? (
          <div className="gp-empty-state">
            <span className="gp-empty-icon">
              <Icon name="ticket" />
            </span>
            <h2>No visits yet</h2>
            <p>When you book a visit on this phone, it shows up here with live updates from the teacher.</p>
            <Link to="/" className="gp-btn gp-btn--dark">
              Book a visit
            </Link>
          </div>
        ) : (
          <ul className="gp-visit-list">
            {rows.map((visit) => (
              <li key={visit.reference}>
                <button type="button" className="gp-visit-card" onClick={() => openVisit(visit)}>
                  <span className="gp-visit-main">
                    <strong>{visit.hostName || 'Your visit'}</strong>
                    <small>{formatWhen(visit.arrival)}</small>
                    <small className="gp-visit-ref">{visit.reference}</small>
                  </span>
                  {visit.status ? (
                    <span className={`gp-visit-status is-${STATUS_TONE[visit.status] || 'wait'}`}>
                      {STATUS_LABEL[visit.status] || visit.status}
                    </span>
                  ) : (
                    <span className="gp-visit-status is-muted">{visit.checking ? 'Checking…' : isRecent(visit) ? 'View' : 'Past'}</span>
                  )}
                  <Icon name="chevronRight" className="gp-visit-chevron" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <Link to="/visit" className="gp-text-link">
          Booked on another phone? Look up a visit by its reference
        </Link>
      </section>
    </AppShell>
  );
}
