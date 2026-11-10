import { formatClockTime } from "../utils";
import GateStatButton from "./GateStatButton";

export default function GateStats({ groups, onSelect }) {
  const { expected, onsite, left } = groups;
  return (
    <div className="grid grid-cols-3 gap-4 max-[768px]:gap-2">
      <GateStatButton
        label="Expected today"
        value={expected.length}
        highlight={expected.length > 0}
        note={
          expected[0]
            ? `Next at ${formatClockTime(expected[0].appointment_date)}`
            : "Nobody else due"
        }
        onClick={() => onSelect("expected")}
      />
      <GateStatButton
        label="Here now"
        value={onsite.length}
        note={
          onsite.length
            ? `Since ${formatClockTime(onsite[0].checked_in_at)}`
            : "Nobody here yet"
        }
        onClick={() => onSelect("onsite")}
      />
      <GateStatButton
        label="Left today"
        value={left.length}
        note="Visits finished"
        onClick={() => onSelect("left")}
      />
    </div>
  );
}
