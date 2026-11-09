import { formatClockTime } from "../admin/utils";
import Button from "../ui/Button";
import Dialog, { DialogTitle } from "../ui/Dialog";
import PreviewResponseFields, { PreviewSection } from "./PreviewResponseFields";
import StatusBadge from "./StatusBadge";
import { ICONS } from "./icons";
import {
  formatDate,
  getInitials,
  rescheduleTimeError,
  statusTone,
  studentLabel,
} from "./utils";

function Detail({ label, children }) {
  return (
    <div className="text-center">
      <span className="mb-1 block text-[12px] text-ink-light">{label}</span>
      {children}
    </div>
  );
}

const VALUE = "text-[14px] text-ink";

export default function RequestPreviewModal({ visit, response, onClose }) {
  const isPending = visit.status === "Pending";
  const student = studentLabel(visit);
  const rescheduleProblem = rescheduleTimeError(
    response.rescheduleTo[visit.id],
    visit,
  );
  const respond = (status) => {
    if (response.chooseResponse(visit, status)) onClose();
  };

  return (
    <Dialog look="sheet" onClose={onClose}>
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <DialogTitle asChild>
          <h3 className="m-0 text-[18px] font-semibold text-ink">
            Appointment Details
          </h3>
        </DialogTitle>
        <button
          type="button"
          className="flex size-8 cursor-pointer items-center justify-center rounded-lg [border:none] bg-surface-2 text-ink-mid hover:bg-line [&_svg]:size-[18px]"
          onClick={onClose}
          aria-label="Close"
        >
          {ICONS.x}
        </button>
      </div>
      <div className="overflow-y-auto p-6 text-center">
        <div
          className="mx-auto mb-4 flex size-[72px] items-center justify-center rounded-[20px] text-[24px] font-semibold"
          style={statusTone(visit.status)}
        >
          {getInitials(visit.visitor_name)}
        </div>
        <h4 className="mt-0 mb-1 text-[20px] font-semibold text-ink">
          {visit.visitor_name}
        </h4>
        <p className="mt-0 mb-5 text-[14px] text-ink-light">
          {visit.visitor_email || visit.visitor_phone}
        </p>

        <div className="mb-5 grid grid-cols-[repeat(3,1fr)] gap-4 max-[768px]:grid-cols-[1fr]">
          <Detail label="Date">
            <strong className={VALUE}>
              {formatDate(visit.appointment_date)}
            </strong>
          </Detail>
          <Detail label="Time">
            <strong className={VALUE}>
              {formatClockTime(visit.appointment_date)}
            </strong>
          </Detail>
          {student && (
            <Detail label="Student">
              <strong className={VALUE}>{student}</strong>
            </Detail>
          )}
          <Detail label="Status">
            <StatusBadge status={visit.status} inDetail />
          </Detail>
        </div>

        {visit.message && (
          <PreviewSection title="Visitor Message">
            <p className="m-0 text-[14px] leading-[1.5] text-ink">
              {visit.message}
            </p>
          </PreviewSection>
        )}

        {visit.response_note && (
          <PreviewSection title="Staff Response">
            <p className="m-0 text-[14px] leading-[1.5] text-ink">
              {visit.response_note}
            </p>
          </PreviewSection>
        )}

        {isPending && (
          <PreviewResponseFields visit={visit} response={response} />
        )}
      </div>
      <div className="flex justify-end gap-3 border-t border-line px-6 py-4">
        <Button variant="subtle" onClick={onClose}>
          Close
        </Button>
        {isPending && (
          <>
            <Button variant="accept" onClick={() => respond("Accepted")}>
              Accept
            </Button>
            <Button
              variant="reschedule"
              disabled={Boolean(rescheduleProblem)}
              title={rescheduleProblem || undefined}
              onClick={() => respond("Rescheduled")}
            >
              Reschedule
            </Button>
            <Button variant="decline" onClick={() => respond("Declined")}>
              Decline
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
}
