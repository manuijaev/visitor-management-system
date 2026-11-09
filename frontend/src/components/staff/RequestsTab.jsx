import RequestCard from "./RequestCard";
import RequestFilterBar from "./RequestFilterBar";
import RequestListCard from "./RequestListCard";
import { ICONS } from "./icons";

function RequestResults({ visits, viewMode, response, onOpenVisit }) {
  if (visits.length === 0) {
    return (
      <div className="col-[1/-1] rounded-2xl border border-line bg-surface p-[60px] text-center [&_svg]:mb-4 [&_svg]:size-12 [&_svg]:text-ink-faint">
        {ICONS.calendar}
        <h3 className="mt-0 mb-2 text-[18px] text-ink">
          No visit requests found
        </h3>
        <p className="m-0 text-[14px] text-ink-light">
          There are no visit requests matching your criteria.
        </p>
      </div>
    );
  }
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-[repeat(3,1fr)] gap-5 max-[1200px]:grid-cols-[repeat(2,1fr)] max-[768px]:grid-cols-[1fr]">
        {visits.map((visit) => (
          <RequestCard
            key={visit.id}
            visit={visit}
            response={response}
            onOpenVisit={onOpenVisit}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 [box-shadow:var(--shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 max-[768px]:flex-col">
        <span className="text-[12px] tracking-[0.08em] text-ink-light uppercase">
          {visits.length} requests
        </span>
      </div>
      <div className="flex flex-col gap-3 max-[480px]:gap-2">
        {visits.map((visit) => (
          <RequestListCard
            key={visit.id}
            visit={visit}
            onOpenVisit={onOpenVisit}
          />
        ))}
      </div>
    </div>
  );
}

export default function RequestsTab({
  visits,
  viewMode,
  response,
  onOpenVisit,
  ...filterBarProps
}) {
  return (
    <>
      <RequestFilterBar viewMode={viewMode} {...filterBarProps} />
      <div className="relative min-h-[200px]">
        <RequestResults
          visits={visits}
          viewMode={viewMode}
          response={response}
          onOpenVisit={onOpenVisit}
        />
      </div>
    </>
  );
}
