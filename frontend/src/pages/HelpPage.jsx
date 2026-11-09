import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../components/visitor/AppShell";
import Icon from "../components/visitor/Icon";
import ListRow, { RowSub, RowText } from "../components/visitor/ui/ListRow";
import ScreenHead from "../components/visitor/ui/ScreenHead";
import SectionLabel from "../components/visitor/ui/SectionLabel";
import ConfirmModal from "../components/ConfirmModal";
import {
  forgetVisitor,
  isReceptionMode,
  loadSavedVisits,
  loadVisitorDetails,
  setReceptionMode,
} from "../services/visitorDevice";

const SETTING_ICON = "size-5 text-gold-dark";

const HOW_STEPS = [
  {
    icon: "clock",
    title: "Choose when",
    text: "Here now, on your way, or a slot later this week. It's one tap.",
  },
  {
    icon: "search",
    title: "Pick a teacher or staff member",
    text: "Search by name or department. You can see who is available.",
  },
  {
    icon: "message",
    title: "Get a text back",
    text: "They are alerted straight away, and you get an SMS as soon as they reply.",
  },
];

function savedVisitsNote(count) {
  if (count <= 0) return "";
  const noun = count === 1 ? "visit" : "visits";
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
    navigate("/");
  };

  return (
    <AppShell title="Help">
      <section className="flex flex-col gap-4">
        <ScreenHead title="How it works">
          Book a visit to the school in under a minute. No account needed.
        </ScreenHead>

        <ol className="m-0 flex list-none flex-col gap-3.5 rounded-[22px] border border-line bg-surface px-4 py-[18px]">
          {HOW_STEPS.map((item, index) => (
            <li key={item.title} className="flex gap-3">
              <span className="grid size-[38px] flex-none place-items-center rounded-xl bg-gold-light text-gold-dark">
                <Icon name={item.icon} />
              </span>
              <span>
                <strong className="block text-[15px]">
                  {index + 1}. {item.title}
                </strong>
                <small className="mt-0.5 block text-[13.5px] text-ink-light">
                  {item.text}
                </small>
              </span>
            </li>
          ))}
        </ol>

        <SectionLabel>Your visits</SectionLabel>
        <div className="flex flex-col gap-2">
          <ListRow to="/visit">
            <Icon name="search" className={SETTING_ICON} />
            <RowText title="Look up a visit">
              <RowSub>
                Use the reference on your visit pass and your phone number.
              </RowSub>
            </RowText>
            <Icon name="chevronRight" className="size-5 text-ink-faint" />
          </ListRow>
          {(details || visitCount > 0) && (
            <ListRow onClick={() => setConfirmingForget(true)}>
              <Icon name="trash" className={SETTING_ICON} />
              <RowText title="Forget me on this phone">
                <RowSub>
                  {details ? `Saved as ${details.name}` : "No saved details"}
                  {savedVisitsNote(visitCount)}
                </RowSub>
              </RowText>
            </ListRow>
          )}
        </div>

        <SectionLabel>For the school</SectionLabel>
        <div className="flex flex-col gap-2">
          <ListRow onClick={() => setConfirmingReception(true)}>
            <Icon name="desk" className={SETTING_ICON} />
            <RowText title="Reception mode">
              <RowSub>
                {isReceptionMode()
                  ? "On. This device is set up for the front desk."
                  : "For a shared tablet at the front desk. Nothing is saved between visitors."}
              </RowSub>
            </RowText>
            <Icon name="chevronRight" className="size-5 text-ink-faint" />
          </ListRow>
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
