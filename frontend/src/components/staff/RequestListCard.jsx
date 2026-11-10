import { formatClockTime, getRelativeTimeLabel } from "../admin/utils";
import SimpleStatus from "./SimpleStatus";
import { ICONS } from "./icons";
import { formatDate, studentLabel } from "./utils";

export default function RequestListCard({ visit, onOpenVisit }) {
  const sentTimestamp = visit.created_at || visit.appointment_date;
  const sentTitle = sentTimestamp
    ? new Date(sentTimestamp).toLocaleString("en-GB")
    : "";
  const student = studentLabel(visit);

  return (
    <button
      type="button"
      className="flex w-full cursor-pointer flex-col items-stretch gap-1.5 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left hover:border-[rgba(201,146,42,0.5)] hover:[box-shadow:var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-safe:transition-[box-shadow,border-color] motion-safe:duration-200"
      onClick={() => onOpenVisit(visit)}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 overflow-hidden text-[15px] font-semibold text-ellipsis whitespace-nowrap text-ink">
          {visit.visitor_name}
        </span>
        <SimpleStatus status={visit.status} />
      </div>
      {visit.appointment_date && (
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink [&_svg]:size-3.5 [&_svg]:flex-none [&_svg]:text-ink-light">
          {ICONS.calendar}
          <span>
            {formatDate(visit.appointment_date)} ·{" "}
            {formatClockTime(visit.appointment_date)}
          </span>
        </div>
      )}
      <div className="text-[13px] leading-[1.4] font-normal text-ink-mid">
        {student
          ? `Student: ${student}`
          : visit.department_name || "General visit"}
      </div>
      <div className="text-[12px] font-normal text-ink-faint" title={sentTitle}>
        Sent {getRelativeTimeLabel(sentTimestamp)}
      </div>
    </button>
  );
}
