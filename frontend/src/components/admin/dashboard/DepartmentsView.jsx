import DepartmentsBoard from "../DepartmentsBoard";
import PageHead from "../PageHead";
import { plural } from "./helpers";

export default function DepartmentsView({
  departments,
  divisions,
  staff,
  onChange,
  notify,
  confirm,
  onAddStaff,
}) {
  return (
    <>
      <PageHead
        title="Departments"
        subtitle={`${departments.length} ${plural(departments.length, "department")} and ${divisions.length} ${plural(divisions.length, "division")}. Visitors choose from these when they book.`}
      />
      <DepartmentsBoard
        departments={departments}
        divisions={divisions}
        staff={staff}
        onChange={onChange}
        notify={notify}
        confirm={confirm}
        onAddStaff={onAddStaff}
      />
    </>
  );
}
