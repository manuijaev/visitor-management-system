import { formatClockTime, getRelativeTimeLabel } from "../admin/utils";
import Panel, { EmptyNote } from "./Panel";
import StatCards from "./StatCards";
import VisitListItem from "./VisitListItem";
import { ICONS } from "./icons";
import { formatDate, statusTone, studentLabel, UPCOMING_TONE } from "./utils";

export default function HomeTab({
  summary,
  recent,
  onOpenPending,
  onOpenVisit,
}) {
  const upcoming = summary.upcoming.slice(0, 3);
  const counts = {
    pending: summary.pending,
    accepted: summary.accepted,
    today: summary.todays.length,
    upcoming: summary.upcoming.length,
  };

  return (
    <>
      <StatCards counts={counts} />

      <div className="mb-8">
        <Panel
          icon={ICONS.calendar}
          title="Up next"
          action={
            counts.pending > 0 && (
              <button
                type="button"
                className="w-auto cursor-pointer [border:none] bg-transparent p-0 text-[13px] font-semibold text-gold-dark [box-shadow:none] hover:underline hover:[transform:none]"
                onClick={onOpenPending}
              >
                {counts.pending} waiting for your reply →
              </button>
            )
          }
        >
          <div className="p-2">
            {upcoming.length === 0 && (
              <EmptyNote>No confirmed visits coming up.</EmptyNote>
            )}
            {upcoming.map((visit) => {
              const student = studentLabel(visit);
              return (
                <VisitListItem
                  key={visit.id}
                  visit={visit}
                  tone={UPCOMING_TONE}
                  onOpen={onOpenVisit}
                >
                  {formatDate(visit.appointment_date)} ·{" "}
                  {formatClockTime(visit.appointment_date)}
                  {student && (
                    <span className="text-[12px] text-ink-mid">
                      Student: {student}
                    </span>
                  )}
                </VisitListItem>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="mb-8">
        <Panel icon={ICONS.activity} title="Recent Activity">
          <div className="p-2">
            {recent.length === 0 && (
              <EmptyNote>No recent visitor requests</EmptyNote>
            )}
            {recent.map((visit) => (
              <VisitListItem
                key={visit.id}
                visit={visit}
                tone={statusTone(visit.status)}
                onOpen={onOpenVisit}
              >
                {formatDate(visit.appointment_date)} -{" "}
                {formatClockTime(visit.appointment_date)}
                <span className="text-[11px] tracking-[0.02em] text-ink-mid lowercase">
                  Sent {getRelativeTimeLabel(visit.created_at)}
                </span>
              </VisitListItem>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
