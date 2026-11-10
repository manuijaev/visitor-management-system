import Button from "../../ui/Button";
import Card from "../Card";
import { EMPTY_LINE, TOOLBAR } from "../styles";
import { LIST_LAYOUTS } from "./rowStyles";
import ViewToggle from "../../ViewToggle";
import Icon from "../Icon";
import PageHead from "../PageHead";
import SearchField from "./SearchField";
import VisitRow from "./VisitRow";
import VisitStatusTabs from "./VisitStatusTabs";
import { filterVisits } from "./helpers";

export default function VisitorsView({
  appointments,
  filters,
  onFiltersChange,
  layout,
  onLayoutChange,
  onExport,
  onReassign,
  onDelete,
}) {
  const visits = filterVisits(appointments, filters);
  const rowLayout = layout === "grid" ? "cards" : "table";

  return (
    <>
      <PageHead
        title="Visitors"
        subtitle="Every visit request across your organisation."
      >
        <Button variant="outline" onClick={onExport}>
          <Icon name="download" size={15} />
          Export CSV
        </Button>
      </PageHead>
      <Card>
        <div className={TOOLBAR} data-toolbar="">
          <VisitStatusTabs
            appointments={appointments}
            value={filters.status}
            onChange={(status) => onFiltersChange({ status })}
          />
          <SearchField
            value={filters.search}
            onChange={(search) => onFiltersChange({ search })}
            placeholder="Search visitors or staff"
          />
          <ViewToggle value={layout} onChange={onLayoutChange} />
        </div>
        <div className={LIST_LAYOUTS[rowLayout]}>
          {visits.map((visit) => (
            <VisitRow
              layout={rowLayout}
              key={visit.id}
              visit={visit}
              onReassign={onReassign}
              onDelete={onDelete}
            />
          ))}
          {!visits.length && (
            <div className={EMPTY_LINE}>No visit requests match.</div>
          )}
        </div>
      </Card>
    </>
  );
}
