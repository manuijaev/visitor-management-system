import DaysOffPanel from "../DaysOffPanel";
import { formatClockTime, getRelativeTimeLabel } from "../admin/utils";
import Panel, { EmptyNote } from "./Panel";
import StatusBadge from "./StatusBadge";
import { ICONS } from "./icons";

export default function ScheduleTab({ todays }) {
  return (
    <div className="flex flex-col gap-5">
      <Panel icon={ICONS.calendar} title="Today's Schedule">
        <div className="p-5">
          {todays.length === 0 && (
            <EmptyNote>No visit requests scheduled for today</EmptyNote>
          )}
          {todays.map((visit) => (
            <div
              key={visit.id}
              className="flex items-start gap-4 border-b border-line py-4 last:border-b-0"
            >
              <div className="min-w-[60px] text-[14px] font-semibold text-gold">
                {formatClockTime(visit.appointment_date)}
              </div>
              <div className="mt-1 size-3 rounded-[50%] bg-gold"></div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-ink">
                  {visit.visitor_name}
                </div>
                <div className="mt-0.5 text-[13px] text-ink-light">
                  {visit.service?.name || "Appointment"}
                </div>
                <div className="mt-1 text-[11px] tracking-[0.02em] text-ink-light">
                  Sent {getRelativeTimeLabel(visit.created_at)}
                </div>
              </div>
              <StatusBadge status={visit.status} />
            </div>
          ))}
        </div>
      </Panel>
      <DaysOffPanel icon={ICONS.calendar} />
    </div>
  );
}
