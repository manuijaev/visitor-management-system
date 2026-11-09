import { INHERIT_TEXT, MOTION_ALL, STRETCHED_ACTION } from "./classes";
import StatusBadge from "./StatusBadge";
import { getInitials } from "./utils";

export default function VisitListItem({ visit, tone, onOpen, children }) {
  return (
    <div
      className={`relative flex cursor-pointer items-center gap-3 rounded-xl p-3 hover:bg-surface-2 max-[760px]:grid max-[760px]:grid-cols-[auto_minmax(0,1fr)] max-[760px]:[align-items:start] max-[760px]:gap-x-3 max-[760px]:gap-y-1.5 ${MOTION_ALL}`}
    >
      <div
        className="flex size-10 items-center justify-center rounded-[10px] text-[13px] font-semibold max-[480px]:size-9 max-[480px]:text-[12px]"
        style={tone}
      >
        {getInitials(visit.visitor_name)}
      </div>
      <div className="flex-1">
        <div className="text-[14px] font-semibold text-ink">
          <button
            type="button"
            className={`${STRETCHED_ACTION} ${INHERIT_TEXT} after:rounded-xl`}
            onClick={() => onOpen(visit)}
          >
            {visit.visitor_name}
          </button>
        </div>
        <div className="mt-0.5 flex flex-col gap-[3px] text-[12px] text-ink-light max-[480px]:text-[11px]">
          {children}
        </div>
      </div>
      <StatusBadge
        status={visit.status}
        className="max-[760px]:col-[2] max-[760px]:justify-self-start"
      />
    </div>
  );
}
