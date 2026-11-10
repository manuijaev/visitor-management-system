import Button from "../../ui/Button";
import Card from "../Card";
import { EMPTY_LINE, INPUT_SKIN, TOOLBAR } from "../styles";
import { LIST_LAYOUTS } from "./rowStyles";
import ViewToggle from "../../ViewToggle";
import Icon from "../Icon";
import PageHead from "../PageHead";
import PersonRow from "./PersonRow";
import SearchField from "./SearchField";
import { filterPeople, plural } from "./helpers";

export default function TeamView({
  user,
  staff,
  departments,
  filters,
  onFiltersChange,
  layout,
  onLayoutChange,
  onAddStaff,
  onEdit,
  actions,
}) {
  const people = filterPeople(staff, filters);
  const rowLayout = layout === "grid" ? "cards" : "table";

  return (
    <>
      <PageHead
        title="Team"
        subtitle={`${staff.length} ${plural(staff.length, "person", "people")} across ${departments.length} ${plural(departments.length, "department")}`}
      >
        <Button
          variant="solid"
          onClick={() => onAddStaff(filters.departmentId || null)}
        >
          <Icon name="userPlus" size={15} />
          Add staff member
        </Button>
      </PageHead>

      <Card>
        <div className={TOOLBAR} data-toolbar="">
          <SearchField
            value={filters.search}
            onChange={(search) => onFiltersChange({ search })}
            placeholder="Search by name, email or department"
          />
          <select
            className={`${INPUT_SKIN} w-auto min-w-[190px] px-3.5 py-[11px]`}
            value={filters.departmentId}
            onChange={(event) =>
              onFiltersChange({ departmentId: event.target.value })
            }
            aria-label="Filter by department"
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <ViewToggle value={layout} onChange={onLayoutChange} />
        </div>
        <div className={LIST_LAYOUTS[rowLayout]}>
          {people.map((member) => (
            <PersonRow
              layout={rowLayout}
              key={member.id}
              member={member}
              isSelf={member.id === user?.id}
              onEdit={onEdit}
              actions={actions}
            />
          ))}
          {!people.length && (
            <div className={EMPTY_LINE}>No one matches that search.</div>
          )}
        </div>
      </Card>
    </>
  );
}
