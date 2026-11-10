import { isSlotTaken } from "./hosts";

const SLOT_GROUPS = [
  { label: "Morning", afternoon: false },
  { label: "Afternoon", afternoon: true },
];

const SLOT =
  "min-h-[42px] rounded-xl border-[1.5px] border-solid text-[13.5px] font-medium tabular-nums disabled:border-dashed disabled:bg-transparent disabled:text-ink-faint disabled:line-through disabled:opacity-60 motion-safe:[transition:background_0.15s_ease,border-color_0.15s_ease,color_0.15s_ease]";

export default function SlotPicker({ slots, slot, host, hostFirst, onPick }) {
  const slotButton = (item) => {
    const taken = isSlotTaken(host, item.value);
    const on = slot === item.value;
    return (
      <button
        key={item.value}
        type="button"
        disabled={!item.available || taken}
        title={
          taken ? `${hostFirst} is already booked at this time` : undefined
        }
        aria-pressed={on}
        className={`${SLOT} ${on ? "border-ink bg-ink text-white" : "border-line bg-surface [&:hover:not(:disabled)]:border-line-strong"}`}
        onClick={() => onPick(item.value)}
      >
        {item.label}
      </button>
    );
  };

  return SLOT_GROUPS.map((group) => (
    <div className="[&+&]:mt-3" key={group.label}>
      <span className="mb-2 block text-[12px] text-ink-faint">
        {group.label}
      </span>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(86px,1fr))] gap-2">
        {slots
          .filter((item) => item.afternoon === group.afternoon)
          .map(slotButton)}
      </div>
    </div>
  ));
}
