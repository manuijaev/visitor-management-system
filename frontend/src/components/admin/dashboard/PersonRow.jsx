import Button from "../../ui/Button";
import Icon from "../Icon";
import { staffStatus } from "../utils";
import Avatar from "./Avatar";
import Pill from "./Pill";
import RowMenu from "./RowMenu";
import rowStyles from "./rowStyles";

function memberMenuItems(member, actions) {
  return [
    member.is_active && {
      label: member.invite_pending
        ? "Resend invite"
        : "Send password reset link",
      icon: "mail",
      onClick: () => actions.sendInvite(member),
    },
    {
      label: member.is_active ? "Deactivate" : "Activate",
      icon: member.is_active ? "x" : "check",
      onClick: () => actions.toggleActive(member),
    },
    {
      label: "Remove",
      icon: "trash",
      danger: true,
      onClick: () => actions.confirmRemoveMember(member),
    },
  ];
}

export default function PersonRow({
  member,
  isSelf,
  layout = "table",
  onEdit,
  actions,
}) {
  const status = staffStatus(member);
  const isAdmin = member.role === "Admin";
  const compact = layout === "compact";
  const styles = rowStyles(layout, "people");
  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <Avatar name={member.full_name} tone={isAdmin ? "ink" : "gold"} />
        <div className={styles.text}>
          <strong className={styles.textStrong}>
            {member.full_name}
            {isSelf && (
              <span className="ml-2 inline-block rounded-[999px] bg-surface-2 px-[7px] py-px align-[1px] text-[11px] font-semibold text-ink-light">
                you
              </span>
            )}
          </strong>
          <span className={styles.textSpan}>{member.email}</span>
        </div>
      </div>
      {!compact && (
        <div className={styles.cell}>
          <strong className={styles.cellStrong}>
            {member.department_name || "No department"}
          </strong>
          <span className={styles.cellSpan}>
            {member.division_name || "No division"}
          </span>
        </div>
      )}
      {!compact && (
        <Pill tone={isAdmin ? "ink" : "muted"} className={styles.pill}>
          {member.role}
        </Pill>
      )}
      <Pill tone={status.tone}>{status.label}</Pill>
      {!compact && (
        <div className={styles.tools}>
          <Button
            variant="icon-sm"
            onClick={() => onEdit(member)}
            aria-label={`Edit ${member.full_name}`}
            title="Edit"
          >
            <Icon name="edit" size={14} />
          </Button>
          {!isSelf && <RowMenu items={memberMenuItems(member, actions)} />}
        </div>
      )}
    </div>
  );
}
