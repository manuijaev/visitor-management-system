import cn from "../ui/cn";

const TONES = {
  pending: "bg-gold-light text-gold-dark",
  accepted: "bg-green-light text-(--green-dark)",
  approved: "bg-green-light text-(--green-dark)",
  completed: "bg-green-light text-(--green-dark)",
  declined: "bg-red-light text-(--red-dark)",
  rejected: "bg-red-light text-(--red-dark)",
  cancelled: "bg-red-light text-(--red-dark)",
  rescheduled: "bg-[#f3eff8] text-purple",
  expired: "bg-surface-2 text-(--muted)",
};

const BACKGROUNDS = {
  pending: "bg-gold-light",
  accepted: "bg-green-light",
  approved: "bg-green-light",
  completed: "bg-green-light",
  declined: "bg-red-light",
  rejected: "bg-red-light",
  cancelled: "bg-red-light",
  rescheduled: "bg-[#f3eff8]",
  expired: "bg-surface-2",
};

const BASE = "rounded-lg px-2.5 py-1 font-semibold tracking-[0.3px] uppercase";

export default function StatusBadge({ status, inDetail = false, className }) {
  const key = status?.toLowerCase();
  const look = inDetail
    ? `mb-1 block text-[12px] text-ink-light ${BACKGROUNDS[key] || ""}`
    : `text-[11px] ${TONES[key] || ""}`;
  return <span className={cn(BASE, look, className)}>{status}</span>;
}
