import Chip from "../ui/Chip";
import { ALL_DEPARTMENTS } from "./constants";
import { SCROLL_ROW } from "./scrollRow";

export default function DepartmentChips({ departments, value, onChange }) {
  const options = [{ id: ALL_DEPARTMENTS, name: "All" }, ...departments];
  return (
    <div
      className={`${SCROLL_ROW} snap-x snap-proximity`}
      role="tablist"
      aria-label="Filter by department"
    >
      {options.map((dept) => {
        const id = String(dept.id);
        return (
          <Chip
            key={id}
            role="tab"
            aria-selected={value === id}
            on={value === id}
            onClick={() => onChange(id)}
          >
            {dept.name}
          </Chip>
        );
      })}
    </div>
  );
}
