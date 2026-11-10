import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import AppShell from "../components/visitor/AppShell";
import Icon from "../components/visitor/Icon";
import Button from "../components/visitor/ui/Button";
import ListRow, { RowSub, RowText } from "../components/visitor/ui/ListRow";
import ScreenHead from "../components/visitor/ui/ScreenHead";
import StatusPill from "../components/visitor/ui/StatusPill";
import { loadSavedVisits } from "../services/visitorDevice";

const TZ = "Africa/Nairobi";
const REFRESH_LIMIT = 6;
const RECENT_MS = 2 * 24 * 60 * 60 * 1000;

const STATUS_TONE = {
  Pending: "wait",
  Accepted: "ok",
  Rescheduled: "wait",
  Declined: "stop",
  Cancelled: "stop",
  Expired: "stop",
};

const STATUS_LABEL = {
  Pending: "Waiting for reply",
  Accepted: "Confirmed",
  Rescheduled: "New time",
  Declined: "Declined",
  Cancelled: "Cancelled",
  Expired: "Closed",
};

const formatWhen = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));

const isRecent = (visit) =>
  new Date(visit.arrival).getTime() > Date.now() - RECENT_MS;

function pendingLabel(visit) {
  if (visit.checking) return "Checking…";
  return isRecent(visit) ? "View" : "Past";
}

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
          .post("/visits/lookup/", {
            reference: visit.reference,
            phone: visit.phone,
          })
          .then(
            ({ data }) =>
              active &&
              setLive((current) => ({ ...current, [visit.reference]: data })),
          )
          .catch(
            () =>
              active &&
              setLive((current) => ({
                ...current,
                [visit.reference]: { unavailable: true },
              })),
          );
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
      return aUpcoming
        ? new Date(a.arrival) - new Date(b.arrival)
        : new Date(b.arrival) - new Date(a.arrival);
    });

  const openVisit = (visit) =>
    navigate(`/visit?ref=${encodeURIComponent(visit.reference)}`, {
      state: { phone: visit.phone },
    });

  return (
    <AppShell title="My visits">
      <section className="flex flex-col gap-4">
        <ScreenHead title="My visits">
          Visits booked on this phone. Tap one to see details or cancel it.
        </ScreenHead>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 rounded-[22px] border border-line bg-surface px-6 py-9 text-center">
            <span className="grid size-[54px] place-items-center rounded-2xl bg-gold-light text-gold-dark">
              <Icon name="ticket" className="size-[26px]" />
            </span>
            <h2 className="mx-0 mb-0 mt-1 text-[18px]">No visits yet</h2>
            <p className="mx-0 mb-2 mt-0 max-w-[320px] text-[14px] text-ink-light">
              When you book a visit on this phone, it shows up here with live
              updates from the teacher.
            </p>
            <Button to="/">Book a visit</Button>
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {rows.map((visit) => (
              <li key={visit.reference}>
                <ListRow onClick={() => openVisit(visit)}>
                  <RowText title={visit.hostName || "Your visit"}>
                    <RowSub>{formatWhen(visit.arrival)}</RowSub>
                    <RowSub className="font-['JetBrains_Mono',monospace]">
                      {visit.reference}
                    </RowSub>
                  </RowText>
                  {visit.status ? (
                    <StatusPill tone={STATUS_TONE[visit.status]}>
                      {STATUS_LABEL[visit.status] || visit.status}
                    </StatusPill>
                  ) : (
                    <StatusPill tone="muted">{pendingLabel(visit)}</StatusPill>
                  )}
                  <Icon name="chevronRight" className="size-5 text-ink-faint" />
                </ListRow>
              </li>
            ))}
          </ul>
        )}

        <Link
          to="/visit"
          className="self-center p-2 text-[13.5px] text-ink-light underline underline-offset-[3px]"
        >
          Booked on another phone? Look up a visit by its reference
        </Link>
      </section>
    </AppShell>
  );
}
