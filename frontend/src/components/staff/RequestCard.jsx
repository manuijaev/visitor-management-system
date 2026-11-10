import { formatClockTime, getRelativeTimeLabel } from "../admin/utils";
import Button from "../ui/Button";
import ResponseArea from "./ResponseArea";
import StatusBadge from "./StatusBadge";
import { MOTION_ALL } from "./classes";
import { ICONS } from "./icons";
import {
  formatDate,
  getInitials,
  hoursSince,
  requestCardTone,
  studentLabel,
} from "./utils";

const URGENT_AFTER_HOURS = 24;

const RESPONSE_BUTTONS = [
  { status: "Accepted", label: "Accept", variant: "accept" },
  { status: "Rescheduled", label: "Reschedule", variant: "reschedule" },
  { status: "Declined", label: "Decline", variant: "decline" },
];

const DETAIL =
  "flex items-center gap-2 text-[13px] text-ink-mid [&_svg]:size-3.5 [&_svg]:text-ink-faint";

const ACTION_BUTTON = "max-[480px]:justify-center";

export default function RequestCard({ visit, response, onOpenVisit }) {
  const isPending = visit.status === "Pending";
  const isUrgent =
    isPending && hoursSince(visit.appointment_date) > URGENT_AFTER_HOURS;
  const student = studentLabel(visit);

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-surface hover:[box-shadow:var(--shadow-md)] hover:[transform:translateY(-2px)] max-[768px]:p-4 ${MOTION_ALL} ${
        isUrgent ? "border-red" : "border-line"
      }`}
    >
      <div className="flex items-center justify-between border-b border-line p-4 max-[480px]:gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-[10px] text-[14px] font-semibold"
          style={requestCardTone(visit.status, isUrgent)}
        >
          {getInitials(visit.visitor_name)}
        </div>
        <div className="flex min-w-[120px] flex-col items-end gap-1.5">
          <StatusBadge status={visit.status} />
          <div className="inline-flex items-center gap-1.5 text-[12px] text-ink-light capitalize">
            <span className="inline-flex size-4 items-center justify-center text-ink-mid [&_svg]:size-3.5">
              {ICONS.clock}
            </span>
            <span>Sent {getRelativeTimeLabel(visit.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h4 className="mt-0 mb-1 text-[16px] font-semibold text-ink max-[480px]:text-[15px]">
          {visit.visitor_name}
        </h4>
        <p className="mt-0 mb-3 text-[13px] text-ink-light">
          {visit.visitor_email || visit.visitor_phone}
        </p>

        <div className="mb-3 flex flex-col gap-2 max-[480px]:gap-1.5">
          <div className={DETAIL}>
            {ICONS.calendar}
            <span>{formatDate(visit.appointment_date)}</span>
          </div>
          <div className={DETAIL}>
            {ICONS.clock}
            <span>{formatClockTime(visit.appointment_date)}</span>
          </div>
          {student && (
            <div className={DETAIL}>
              {ICONS.user}
              <span>Student: {student}</span>
            </div>
          )}
          {visit.service?.name && (
            <div className={DETAIL}>
              {ICONS.activity}
              <span>{visit.service.name}</span>
            </div>
          )}
        </div>

        {visit.message && (
          <p className="m-0 rounded-lg bg-surface-2 p-2.5 text-[13px] text-ink-light italic">
            "{visit.message}"
          </p>
        )}
      </div>

      <div className="flex gap-2 border-t border-line px-4 py-3 max-[480px]:flex-col">
        {isPending ? (
          RESPONSE_BUTTONS.map((button) => (
            <Button
              key={button.status}
              variant={button.variant}
              className={ACTION_BUTTON}
              onClick={() => response.openResponseArea(visit.id, button.status)}
            >
              {button.label}
            </Button>
          ))
        ) : (
          <Button
            variant="subtle"
            className={ACTION_BUTTON}
            onClick={() => onOpenVisit(visit)}
          >
            View Details
          </Button>
        )}
      </div>

      {isPending && response.openAreas[visit.id] && (
        <ResponseArea visit={visit} response={response} />
      )}
    </div>
  );
}
