import { useMemo, useState } from "react";
import api from "../../services/api";
import Button from "../ui/Button";
import Card from "./Card";
import Icon from "./Icon";
import { INPUT } from "./styles";
import { formatApiError } from "./utils";
import DepartmentCard from "./departments/DepartmentCard";

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
  }
  return counts;
}

export default function DepartmentsBoard({
  departments,
  divisions,
  staff,
  onChange,
  notify,
  confirm,
  onAddStaff,
}) {
  const [newDepartment, setNewDepartment] = useState("");
  const [editing, setEditing] = useState(null);

  const departmentHeadcount = useMemo(
    () => countBy(staff, "department"),
    [staff],
  );
  const divisionHeadcount = useMemo(() => countBy(staff, "division"), [staff]);

  const run = async (request, successMessage) => {
    try {
      await request();
      await onChange();
      if (successMessage) notify(successMessage);
      return true;
    } catch (err) {
      notify(formatApiError(err), "error");
      return false;
    }
  };

  const createDepartment = async (e) => {
    e.preventDefault();
    const name = newDepartment.trim();
    if (!name) return;
    if (await run(() => api.post("/departments/", { name }), `${name} added`))
      setNewDepartment("");
  };

  const createDivision = (name, departmentId) =>
    run(
      () => api.post("/divisions/", { name, department: departmentId }),
      `${name} division added`,
    );

  const renameDepartment = async (dept, name) => {
    const request = () => api.patch(`/departments/${dept.id}/`, { name });
    if (await run(request, "Department renamed")) setEditing(null);
  };

  const renameDivision = async (div, name) => {
    const request = () =>
      api.patch(`/divisions/${div.id}/`, { name, department: div.department });
    if (await run(request, "Division renamed")) setEditing(null);
  };

  const confirmDeleteDepartment = (dept, divisionCount, headcount) =>
    confirm({
      title: `Delete ${dept.name}?`,
      message: headcount
        ? `Its ${divisionCount} divisions will be removed and ${headcount} staff will need a new department.`
        : "Its divisions will be removed too.",
      confirmText: "Delete",
      tone: "danger",
      action: () =>
        run(
          () => api.delete(`/departments/${dept.id}/`),
          `${dept.name} deleted`,
        ),
    });

  const confirmDeleteDivision = (div) =>
    confirm({
      title: `Delete ${div.name}?`,
      message: "Staff in this division will need to be moved to another one.",
      confirmText: "Delete",
      tone: "danger",
      action: () =>
        run(() => api.delete(`/divisions/${div.id}/`), `${div.name} deleted`),
    });

  return (
    <div className="flex flex-col gap-[18px]">
      <Card
        as="form"
        className="flex items-center gap-3 py-3 pr-3 pl-5 text-gold-dark max-[768px]:flex-wrap max-[768px]:p-3"
        onSubmit={createDepartment}
      >
        <Icon name="building" size={18} className="max-[768px]:hidden" />
        <input
          className={`${INPUT} flex-1 max-[768px]:basis-full`}
          value={newDepartment}
          onChange={(e) => setNewDepartment(e.target.value)}
          placeholder="New department name, e.g. Finance"
          aria-label="New department name"
        />
        <Button
          type="submit"
          variant="solid"
          className="max-[768px]:flex-[1_1_100%] max-[768px]:justify-center"
          disabled={!newDepartment.trim()}
        >
          <Icon name="plus" size={15} />
          Add department
        </Button>
      </Card>

      {departments.length === 0 && (
        <div className="flex flex-col items-center gap-1.5 px-5 py-10 text-center text-ink-light">
          <Icon name="building" size={28} strokeWidth={1.5} />
          <strong className="text-[16px] text-ink">No departments yet</strong>
          <span>
            Create one above, or add a staff member and create it as part of
            that flow.
          </span>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4">
        {departments.map((dept) => (
          <DepartmentCard
            key={dept.id}
            department={dept}
            divisions={divisions.filter((d) => d.department === dept.id)}
            headcount={departmentHeadcount.get(dept.id) ?? 0}
            divisionHeadcount={divisionHeadcount}
            editing={editing}
            setEditing={setEditing}
            onRenameDepartment={renameDepartment}
            onRenameDivision={renameDivision}
            onDeleteDepartment={confirmDeleteDepartment}
            onDeleteDivision={confirmDeleteDivision}
            onCreateDivision={createDivision}
            onAddStaff={onAddStaff}
          />
        ))}
      </div>
    </div>
  );
}
