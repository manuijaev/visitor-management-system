import Button from "../ui/Button";
import ErrorNote from "../ui/ErrorNote";
import Ticket from "../ui/Ticket";
import LookupHeading, { LOOKUP_BODY } from "./LookupHeading";
import { formatWhen, hostNameOf, statusCopyFor } from "./visitStatus";

const TONE_BORDER = {
  ok: "border-l-green",
  wait: "border-l-gold",
  stop: "border-l-red",
};

const ACTION = "max-[540px]:flex-[1_1_100%]";

export default function VisitResult({ visit, error, onCancel, onStartOver }) {
  const copy = statusCopyFor(visit.status);
  const host = hostNameOf(visit);
  const items = [
    { label: "Visitor", value: visit.visitor_name },
    { label: "Seeing", value: host },
    { label: "When", value: formatWhen(visit.appointment_date) },
    { label: "Status", value: visit.status },
  ];

  return (
    <div className={LOOKUP_BODY}>
      <LookupHeading eyebrow={visit.reference} title={copy.title}>
        {copy.text(host)}
      </LookupHeading>

      <Ticket items={items} className={`border-l-4 ${TONE_BORDER[copy.tone]}`}>
        {visit.response_note && (
          <p className="m-0 border-t [--tw-border-style:dashed] border-line px-[18px] pb-[18px] pt-3.5 text-[14px] leading-[1.55]">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              Message from {host}
            </span>
            {visit.response_note}
          </p>
        )}
      </Ticket>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="mt-[22px] flex flex-wrap justify-end gap-2.5">
        {visit.can_cancel && (
          <Button variant="ghost" className={ACTION} onClick={onCancel}>
            Cancel visit
          </Button>
        )}
        <Button className={ACTION} onClick={onStartOver}>
          Check another visit
        </Button>
      </div>
    </div>
  );
}
