import { matchesVisitFilter, VISIT_FILTERS } from "../utils";
import SegmentedTabs from "./SegmentedTabs";

export default function VisitStatusTabs({ appointments, value, onChange }) {
  const tabs = VISIT_FILTERS.map((filter) => ({
    id: filter.id,
    label: filter.label,
    count: appointments.filter((visit) => matchesVisitFilter(visit, filter.id))
      .length,
  }));
  return (
    <SegmentedTabs
      label="Visit status"
      tabs={tabs}
      value={value}
      onChange={onChange}
    />
  );
}
