const NOTCH =
  "before:absolute before:-left-[11px] before:-top-[11px] before:size-5 before:rounded-[50%] before:border-[1.5px] before:border-solid before:border-line before:bg-surface before:[clip-path:inset(0_0_0_50%)] after:absolute after:-right-[11px] after:-top-[11px] after:size-5 after:rounded-[50%] after:border-[1.5px] after:border-solid after:border-line after:bg-surface after:[clip-path:inset(0_50%_0_0)]";

export default function TicketFoot({ status, reference }) {
  return (
    <div
      className={`relative flex items-center justify-between gap-3 border-t-[1.5px] [--tw-border-style:dashed] border-line-strong px-[18px] py-3.5 text-[13px] ${NOTCH}`}
    >
      <span className="inline-flex items-center gap-2 font-semibold text-gold-dark">
        <span
          className="size-2 rounded-[50%] bg-gold motion-safe:animate-[gp-pulse_1.6s_ease-out_infinite]"
          aria-hidden="true"
        />
        {status}
      </span>
      <span className="font-['JetBrains_Mono',monospace] text-[12.5px] tracking-[0.04em] text-ink-light">
        {reference}
      </span>
    </div>
  );
}
