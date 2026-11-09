import { STAT, STAT_LABEL, STAT_NOTE, STAT_VALUE } from "../styles";
import { plural } from "./helpers";

function invitedNote(invited) {
  if (!invited) return "Everyone is set up";
  return `${invited} ${plural(invited, "invite")} pending`;
}

function Stat({ label, value, highlight = false, note }) {
  return (
    <div className={STAT}>
      <span className={STAT_LABEL}>{label}</span>
      <strong
        className={`${STAT_VALUE} ${highlight ? "text-gold-dark" : "text-ink"}`}
      >
        {value}
      </strong>
      <small className={STAT_NOTE}>{note}</small>
    </div>
  );
}

export default function OverviewStats({ stats, departments, divisions }) {
  return (
    <div className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2">
      <Stat label="Visit requests" value={stats.total} note="All time" />
      <Stat
        label="Awaiting response"
        value={stats.pending}
        highlight={stats.pending > 0}
        note={stats.overdue ? `${stats.overdue} overdue` : "Nothing overdue"}
      />
      <Stat
        label="Active staff"
        value={stats.active}
        note={invitedNote(stats.invited)}
      />
      <Stat
        label="Departments"
        value={departments.length}
        note={`${divisions.length} ${plural(divisions.length, "division")}`}
      />
    </div>
  );
}
