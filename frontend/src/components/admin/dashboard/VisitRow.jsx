import Button from "../../ui/Button";
import Icon from "../Icon";
import { formatVisitDate, getRelativeTimeLabel } from "../utils";
import Avatar from "./Avatar";
import Pill from "./Pill";
import { STATUS_TONE } from "./constants";
import { studentLabel } from "./helpers";
import rowStyles from "./rowStyles";

function visitSubtitle(visit, compact) {
  if (compact) return `with ${visit.staff_name || "Unassigned"}`;
  const student = studentLabel(visit);
  return [
    visit.visitor_email || visit.visitor_phone,
    student && `re ${student}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function VisitRow({
  visit,
  layout = "table",
  onReassign,
  onDelete,
}) {
  const compact = layout === "compact";
  const styles = rowStyles(layout, "visits");
  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <Avatar name={visit.visitor_name} />
        <div className={styles.text}>
          <strong className={styles.textStrong}>{visit.visitor_name}</strong>
          <span className={styles.textSpan}>
            {visitSubtitle(visit, compact)}
          </span>
        </div>
      </div>
      {!compact && (
        <div className={styles.cell}>
          <strong className={styles.cellStrong}>
            {visit.staff_name || "Unassigned"}
          </strong>
          <span className={styles.cellSpan}>{visit.department_name}</span>
        </div>
      )}
      <div className={styles.date}>
        <strong className={`${styles.cellStrong} lining-nums`}>
          {formatVisitDate(visit.appointment_date)}
        </strong>
        <span className={styles.cellSpan}>
          Sent{" "}
          {getRelativeTimeLabel(visit.created_at || visit.appointment_date)}
        </span>
      </div>
      <Pill tone={STATUS_TONE[visit.status]} className={styles.pill}>
        {visit.status}
      </Pill>
      {!compact && (
        <div className={styles.tools}>
          <Button
            variant="icon-sm"
            title="Reassign"
            aria-label={`Reassign ${visit.visitor_name}`}
            onClick={() => onReassign(visit)}
          >
            <Icon name="swap" size={14} />
          </Button>
          <Button
            variant="icon-danger"
            title="Delete"
            aria-label={`Delete visit from ${visit.visitor_name}`}
            onClick={() => onDelete(visit)}
          >
            <Icon name="trash" size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
