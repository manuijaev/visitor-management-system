import { MOTION_ALL } from "./classes";
import { ICONS } from "./icons";

const goldTone = { background: "var(--gold-light)", color: "var(--gold-dark)" };

const CARDS = [
  { key: "pending", label: "Pending", icon: ICONS.clock, tone: goldTone },
  {
    key: "accepted",
    label: "Accepted",
    icon: ICONS.check,
    tone: { background: "var(--green-light)", color: "var(--green-dark)" },
  },
  {
    key: "today",
    label: "Today",
    icon: ICONS.calendar,
    tone: { background: "var(--surface2)", color: "var(--ink)" },
  },
  { key: "upcoming", label: "Coming up", icon: ICONS.check, tone: goldTone },
];

export default function StatCards({ counts }) {
  return (
    <div className="mb-8 grid grid-cols-[repeat(4,1fr)] gap-5 max-[1200px]:grid-cols-[repeat(2,1fr)] max-[768px]:grid-cols-[1fr] max-[760px]:grid-cols-[repeat(2,minmax(0,1fr))] max-[760px]:gap-3">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className={`flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 hover:[box-shadow:var(--shadow-md)] hover:[transform:translateY(-2px)] max-[768px]:p-4 max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-2 ${MOTION_ALL}`}
        >
          <div
            className="flex size-[52px] items-center justify-center rounded-[14px] max-[480px]:size-9 [&_svg]:size-6 max-[480px]:[&_svg]:size-[18px]"
            style={card.tone}
          >
            {card.icon}
          </div>
          <div>
            <div className="font-['Cormorant_Garamond',serif] text-[36px] leading-none font-bold text-ink [font-variant-numeric:lining-nums] max-[768px]:text-[24px] max-[480px]:text-[20px]">
              {counts[card.key]}
            </div>
            <div className="mt-1 text-[13px] text-ink-light max-[480px]:text-[12px]">
              {card.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
