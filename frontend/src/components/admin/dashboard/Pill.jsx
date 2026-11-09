import cn from "../../ui/cn";

const TONES = {
  gold: "bg-gold-light text-gold-dark",
  green: "bg-green-light text-green",
  red: "bg-red-light text-red",
  purple: "bg-[#f3eff8] text-purple",
  muted: "bg-surface-2 text-ink-light",
  ink: "bg-ink text-white",
};

export default function Pill({ tone = "muted", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center justify-self-start whitespace-nowrap rounded-[999px] px-2.5 py-1 text-[12px] font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
