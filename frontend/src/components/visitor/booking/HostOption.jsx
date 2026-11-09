import { initials, placement } from "./hosts";

const TONES = [
  "bg-[#fdf3e3] text-[#8a6018]",
  "bg-[#e6f4f2] text-[#1a7a72]",
  "bg-[#e8f5ee] text-[#1e7e4a]",
  "bg-[#f3f0ec] text-[#3d3832]",
  "bg-[#efe9f6] text-[#6f5a92]",
];

const NOTE = "mt-[3px] block text-[12px] not-italic";
const ELLIPSIS = "block overflow-hidden text-ellipsis whitespace-nowrap";

function hostNote(member, block, mode) {
  if (block) {
    return <em className={`${NOTE} text-red`}>{block}</em>;
  }
  if (mode === "later" && !member.available) {
    return (
      <em className={`${NOTE} text-gold-dark`}>Away today, but you can book</em>
    );
  }
  return null;
}

export default function HostOption({ member, block, selected, mode, onPick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={Boolean(block)}
      className={`flex w-full items-center gap-3 rounded-[18px] border-[1.5px] border-solid px-3.5 py-3 text-left disabled:opacity-55 [&:hover:not(:disabled)]:border-line-strong [&:hover:not(:disabled)]:bg-bg motion-safe:[transition:border-color_0.15s_ease,background_0.15s_ease,box-shadow_0.15s_ease] ${selected ? "border-ink bg-bg [box-shadow:0_0_0_3px_rgba(201,146,42,0.2)]" : "border-line bg-surface"}`}
      onClick={() => onPick(member)}
    >
      <span
        className={`grid size-11 flex-none place-items-center rounded-[14px] text-[14px] font-semibold tracking-[0.03em] ${TONES[member.id % 5]}`}
      >
        {initials(member.name)}
      </span>
      <span className="min-w-0 flex-1">
        <strong className={`${ELLIPSIS} text-[15px] font-semibold`}>
          {member.name}
        </strong>
        <small className={`${ELLIPSIS} mt-px text-[12.5px] text-ink-light`}>
          {placement(member) || "Staff"}
        </small>
        {hostNote(member, block, mode)}
      </span>
      <span
        className={`inline-flex flex-none items-center gap-1.5 text-[12px] font-semibold before:size-2 before:rounded-[50%] before:bg-current max-[519px]:gap-0 max-[519px]:text-[0px] ${member.available ? "text-green" : "text-ink-faint"}`}
      >
        {member.available ? "Available" : "Away"}
      </span>
    </button>
  );
}
