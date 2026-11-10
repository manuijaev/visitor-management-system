import Icon from "../Icon";
import ReviewRow from "./ReviewRow";
import ErrorNote from "../ui/ErrorNote";
import { placement } from "./hosts";
import { studentLabel, visitNote, whenLabel } from "./visit";

export default function ReviewStep({ flow, receptionMode }) {
  const { host, hostFirst, goToStep } = flow;
  const { visitor } = flow.details;
  const { submitError } = flow.submission;
  const student = studentLabel(visitor);
  const note = visitNote(visitor);
  const editDetails = () => goToStep(2);

  return (
    <>
      <div className="overflow-hidden rounded-[20px] border-[1.5px] border-solid border-line">
        <ReviewRow
          icon="clock"
          label="When"
          value={whenLabel(flow)}
          onEdit={() => goToStep(0)}
        />
        <ReviewRow
          icon="user"
          label="Seeing"
          value={host?.name}
          sub={host && placement(host)}
          onEdit={() => goToStep(1)}
        />
        <ReviewRow
          icon="pin"
          label="Visitor"
          value={visitor.name.trim()}
          sub={[visitor.phone.trim(), visitor.email.trim()]
            .filter(Boolean)
            .join(" · ")}
          onEdit={editDetails}
        />
        {student && (
          <ReviewRow
            icon="user"
            label="Student"
            value={student}
            onEdit={editDetails}
          />
        )}
        {note && (
          <ReviewRow
            icon="message"
            label="Note"
            value={note}
            onEdit={editDetails}
          />
        )}
      </div>
      <p className="mb-0 mt-3.5 flex gap-2.5 text-[13px] leading-normal text-ink-light">
        <Icon name="message" className="mt-px size-[18px] text-gold" />
        <span>
          {hostFirst} gets an SMS, email and push alert.{" "}
          {receptionMode ? "The visitor" : "You"} will get a text at{" "}
          <strong>{visitor.phone.trim()}</strong> when they respond.
        </span>
      </p>
      {submitError && <ErrorNote>{submitError}</ErrorNote>}
    </>
  );
}
