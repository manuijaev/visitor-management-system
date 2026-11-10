import Button from "../../ui/Button";
import Avatar from "../dashboard/Avatar";

const TRUNCATE = "overflow-hidden text-ellipsis whitespace-nowrap";

export default function GateRow({ visit, tab, busy, onAction }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[14px] px-3 py-2.5 hover:bg-surface-hover max-[768px]:grid-cols-[auto_minmax(0,1fr)_auto] max-[768px]:gap-x-3 max-[768px]:gap-y-1.5 max-[768px]:[grid-template-areas:'avatar_text_text'_'avatar_time_action']">
      <Avatar
        name={visit.visitor_name}
        className="max-[768px]:self-start max-[768px]:[grid-area:avatar]"
      />
      <div className="flex min-w-0 flex-col max-[768px]:[grid-area:text]">
        <strong className={TRUNCATE}>{visit.visitor_name}</strong>
        <span
          className={`${TRUNCATE} text-[13px] text-ink-light max-[768px]:whitespace-normal`}
        >
          Seeing {visit.staff_name || "unassigned"}
          {visit.department_name ? ` · ${visit.department_name}` : ""}
        </span>
      </div>
      <span className="text-[13px] text-ink-light tabular-nums max-[768px]:[grid-area:time]">
        {tab.time(visit)}
      </span>
      {tab.action && (
        <Button
          variant={tab.variant}
          className="max-[768px]:[grid-area:action]"
          disabled={busy}
          onClick={() => onAction(visit, tab.action)}
        >
          {busy ? "Saving…" : tab.actionLabel}
        </Button>
      )}
    </div>
  );
}
