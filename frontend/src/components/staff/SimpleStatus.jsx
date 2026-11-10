const TONES = {
  pending: "bg-[#ffdfc1] text-[#9c5200]",
  accepted: "bg-[#9cdbba] text-[#18643b]",
  declined: "bg-[#ffc1c1] text-[#a33024]",
  cancelled: "bg-[#ffc1c1] text-[#a33024]",
  rescheduled: "bg-[#c7deff] text-[#245c9d]",
  expired: "bg-surface-2 text-(--muted)",
};

export default function SimpleStatus({ status }) {
  const key = (status || "pending").toLowerCase();
  return (
    <span
      className={`flex-none rounded-[999px] px-[9px] py-[3px] text-[11px] font-bold tracking-[0.04em] uppercase ${TONES[key] || ""}`}
    >
      {status}
    </span>
  );
}
