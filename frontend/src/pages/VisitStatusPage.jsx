import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import AppShell from '../components/visitor/AppShell';
import ConfirmModal from '../components/ConfirmModal';

const TZ = 'Africa/Nairobi';

const STATUS_COPY = {
  Pending: { tone: 'wait', title: 'Waiting for a reply', text: (host) => `${host} hasn't responded yet. We'll text you when they do.` },
  Accepted: { tone: 'ok', title: 'Visit confirmed', text: (host) => `${host} is expecting you.` },
  Rescheduled: { tone: 'wait', title: 'New time proposed', text: (host) => `${host} moved your visit to the time below.` },
  Declined: { tone: 'stop', title: 'Visit declined', text: (host) => `${host} can't make this visit.` },
  Cancelled: { tone: 'stop', title: 'Visit cancelled', text: () => 'This visit has been cancelled.' },
};

const formatWhen = (value) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value));

const errorMessage = (error) => {
  if (error?.response?.status === 429) return 'Too many attempts. Please wait a while and try again.';
  if (!error?.response) return "We couldn't reach the server. Check your connection and try again.";
  return error.response.data?.detail || 'Something went wrong. Please try again.';
};

export default function VisitStatusPage() {
  const [params] = useSearchParams();
  const [reference, setReference] = useState(params.get('ref') || '');
  const { state } = useLocation();
  const [phone, setPhone] = useState(state?.phone || '');
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const credentials = { reference: reference.trim(), phone: phone.trim() };

  const lookUp = async (event) => {
    event?.preventDefault();
    if (!credentials.reference || !credentials.phone || loading) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/visits/lookup/', credentials);
      setVisit(data);
    } catch (err) {
      setVisit(null);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state?.phone && params.get('ref')) lookUp();
    // Runs once, when opened from My visits with the saved phone number.
  }, []);

  const cancelVisit = async () => {
    setCancelling(true);
    setError('');
    try {
      const { data } = await api.post('/visits/cancel/', credentials);
      setVisit(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCancelling(false);
      setConfirmingCancel(false);
    }
  };

  const copy = visit ? STATUS_COPY[visit.status] || STATUS_COPY.Pending : null;
  const host = visit?.staff_name || 'Your host';

  return (
    <AppShell title="Check a visit">
      <section className="gp-flow gp-lookup">
        {!visit ? (
          <form className="gp-lookup-body" onSubmit={lookUp}>
            <p className="gp-eyebrow">Check your visit</p>
            <h1>Where&apos;s my visit?</h1>
            <p className="gp-lookup-intro">
              Enter the reference from your visit pass and the phone number you booked with.
            </p>
            <div className="gp-fields">
              <label className="gp-field gp-field--full">
                <span className="gp-label">Reference</span>
                <input
                  className="gp-input"
                  autoComplete="off"
                  autoCapitalize="characters"
                  placeholder="e.g. GP-00012"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                />
              </label>
              <label className="gp-field gp-field--full">
                <span className="gp-label">Phone number</span>
                <input
                  className="gp-input"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
            </div>
            {error && (
              <div className="gp-error" role="alert">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="gp-btn gp-btn--dark gp-btn--grow gp-lookup-submit"
              disabled={!credentials.reference || !credentials.phone || loading}
            >
              {loading ? 'Checking…' : 'Check my visit'}
            </button>
          </form>
        ) : (
          <div className="gp-lookup-body">
            <p className="gp-eyebrow">{visit.reference}</p>
            <h1>{copy.title}</h1>
            <p className="gp-lookup-intro">{copy.text(host)}</p>

            <div className={`gp-ticket gp-lookup-ticket is-${copy.tone}`}>
              <dl className="gp-ticket-grid">
                <div>
                  <dt>Visitor</dt>
                  <dd>{visit.visitor_name}</dd>
                </div>
                <div>
                  <dt>Seeing</dt>
                  <dd>{host}</dd>
                </div>
                <div>
                  <dt>When</dt>
                  <dd>{formatWhen(visit.appointment_date)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{visit.status}</dd>
                </div>
              </dl>
              {visit.response_note && (
                <p className="gp-lookup-note">
                  <span>Message from {host}</span>
                  {visit.response_note}
                </p>
              )}
            </div>

            {error && (
              <div className="gp-error" role="alert">
                {error}
              </div>
            )}

            <div className="gp-lookup-actions">
              {visit.can_cancel && (
                <button type="button" className="gp-btn gp-btn--ghost" onClick={() => setConfirmingCancel(true)}>
                  Cancel visit
                </button>
              )}
              <button
                type="button"
                className="gp-btn gp-btn--dark"
                onClick={() => {
                  setVisit(null);
                  setError('');
                }}
              >
                Check another visit
              </button>
            </div>
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={confirmingCancel}
        title="Cancel this visit?"
        message={visit ? `${host} will be told you're no longer coming. This can't be undone.` : ''}
        confirmText="Yes, cancel"
        cancelText="Keep visit"
        loadingText="Cancelling"
        tone="danger"
        isLoading={cancelling}
        onConfirm={cancelVisit}
        onCancel={() => !cancelling && setConfirmingCancel(false)}
      />
    </AppShell>
  );
}
