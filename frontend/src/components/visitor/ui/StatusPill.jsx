const TONES = {
  ok: "bg-green-light text-green",
  wait: "bg-gold-light text-gold-dark",
  stop: "bg-red-light text-red",
  muted: "bg-surface-2 text-ink-faint",
};

export default function StatusPill({ tone, children }) {
  return (
    <span
      className={`flex-none whitespace-nowrap rounded-[999px] px-2.5 py-[5px] text-[12px] font-semibold ${TONES[tone] || TONES.wait}`}
    >
      {children}
    </span>
  );
}
