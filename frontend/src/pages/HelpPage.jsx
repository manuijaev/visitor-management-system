import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/visitor/AppShell';
import Icon from '../components/visitor/Icon';
import ConfirmModal from '../components/ConfirmModal';
import {
  forgetVisitor,
  isReceptionMode,
  loadSavedVisits,
  loadVisitorDetails,
  setReceptionMode,
} from '../services/visitorDevice';

const HOW_STEPS = [
  { icon: 'clock', title: 'Choose when', text: "Here now, on your way, or a slot later this week. It's one tap." },
  { icon: 'search', title: 'Pick a teacher or staff member', text: 'Search by name or department. You can see who is available.' },
  { icon: 'message', title: 'Get a text back', text: 'They are alerted straight away, and you get an SMS as soon as they reply.' },
];

function savedVisitsNote(count) {
  if (count <= 0) return '';
  const noun = count === 1 ? 'visit' : 'visits';
  return ` · ${count} ${noun} saved`;
}

export default function HelpPage() {
  const navigate = useNavigate();
  const [details, setDetails] = useState(loadVisitorDetails);
  const [visitCount, setVisitCount] = useState(() => loadSavedVisits().length);
  const [confirmingForget, setConfirmingForget] = useState(false);
  const [confirmingReception, setConfirmingReception] = useState(false);

  const forget = () => {
    forgetVisitor();
    setDetails(null);
    setVisitCount(0);
    setConfirmingForget(false);
  };

  const startReception = () => {
    setReceptionMode(true);
    navigate('/');
  };

  return (
    <AppShell title="Help">
      <section className="gp-screen">
        <header className="gp-screen-head">
          <h1>How it works</h1>
          <p>Book a visit to the school in under a minute. No account needed.</p>
        </header>

        <ol className="gp-help-steps">
          {HOW_STEPS.map((item, index) => (
            <li key={item.title}>
              <span className="gp-help-icon">
                <Icon name={item.icon} />
              </span>
              <span>
                <strong>
                  {index + 1}. {item.title}
                </strong>
                <small>{item.text}</small>
              </span>
            </li>
          ))}
        </ol>

        <h2 className="gp-screen-sub">Your visits</h2>
        <div className="gp-settings">
          <Link to="/visit" className="gp-setting">
            <Icon name="search" />
            <span>
              <strong>Look up a visit</strong>
              <small>Use the reference on your visit pass and your phone number.</small>
            </span>
            <Icon name="chevronRight" className="gp-setting-chevron" />
          </Link>
          {(details || visitCount > 0) && (
            <button type="button" className="gp-setting" onClick={() => setConfirmingForget(true)}>
              <Icon name="trash" />
              <span>
                <strong>Forget me on this phone</strong>
                <small>
                  {details ? `Saved as ${details.name}` : 'No saved details'}
                  {savedVisitsNote(visitCount)}
                </small>
              </span>
            </button>
          )}
        </div>

        <h2 className="gp-screen-sub">For the school</h2>
        <div className="gp-settings">
          <button type="button" className="gp-setting" onClick={() => setConfirmingReception(true)}>
            <Icon name="desk" />
            <span>
              <strong>Reception mode</strong>
              <small>
                {isReceptionMode()
                  ? 'On. This device is set up for the front desk.'
                  : 'For a shared tablet at the front desk. Nothing is saved between visitors.'}
              </small>
            </span>
            <Icon name="chevronRight" className="gp-setting-chevron" />
          </button>
        </div>
      </section>

      <ConfirmModal
        isOpen={confirmingForget}
        title="Forget me on this phone?"
        message="Your saved name, phone number and visit list will be removed from this phone. Your visits themselves are not cancelled."
        confirmText="Forget me"
        cancelText="Keep"
        tone="danger"
        onConfirm={forget}
        onCancel={() => setConfirmingForget(false)}
      />
      <ConfirmModal
        isOpen={confirmingReception}
        title="Turn on reception mode?"
        message="Use this on a shared front-desk tablet. The app goes straight to checking in walk-in visitors, hides the tabs, and saves nothing between visitors. Turn it off from the banner on the booking screen."
        confirmText="Turn on"
        cancelText="Not now"
        onConfirm={startReception}
        onCancel={() => setConfirmingReception(false)}
      />
    </AppShell>
  );
}
