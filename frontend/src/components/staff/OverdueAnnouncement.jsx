import { getRelativeTimeLabel } from "../admin/utils";
import { STRETCHED_ACTION } from "./classes";

export default function OverdueAnnouncement({ overdue, onOpen }) {
  const [oldest] = overdue;
  const isSingle = overdue.length === 1;
  const visitorName = oldest?.visitor_name || "A visitor";
  const detail = isSingle
    ? `${visitorName} is waiting for your reply.`
    : `${visitorName} has waited longest.`;

  return (
    <div className="relative mx-6 my-3 flex cursor-pointer items-center justify-between rounded-2xl border border-[rgba(209,53,43,0.3)] bg-[linear-gradient(135deg,rgba(209,53,43,0.12),rgba(255,255,255,0.85))] px-5 py-4 [box-shadow:0_10px_28px_rgba(209,53,43,0.18)] hover:[box-shadow:0_18px_40px_rgba(209,53,43,0.25)] hover:[transform:translateY(-2px)] max-[768px]:flex-col max-[768px]:items-start motion-safe:transition-[transform,box-shadow] motion-safe:duration-[250ms]">
      <div>
        <p className="m-0 text-[14px] font-bold text-[#7b1f1f]">
          ⚠️ {overdue.length} {isSingle ? "request needs" : "requests need"} a
          reply
        </p>
        <p className="mt-1 mb-0 text-[12px] text-[#3d1f1f]">
          {detail} Tap to reply.
        </p>
      </div>
      <div className="flex flex-col gap-1 text-right text-[12px] text-[#2c1c16]">
        <span>
          Asked{" "}
          {getRelativeTimeLabel(oldest?.created_at || oldest?.appointment_date)}
        </span>
        <button
          type="button"
          className={`${STRETCHED_ACTION} text-right text-[12px] font-semibold tracking-[0.05em] text-[#b73535] after:rounded-2xl`}
          onClick={onOpen}
        >
          Open now →
        </button>
      </div>
    </div>
  );
}
