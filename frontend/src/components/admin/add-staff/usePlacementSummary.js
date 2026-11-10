import { useMemo } from "react";

export default function usePlacementSummary(placement, departments, divisions) {
  const isNewDepartment = placement.deptMode === "new";
  const selectedDepartment = departments.find(
    (d) => String(d.id) === placement.departmentId,
  );
  const departmentDivisions = useMemo(
    () =>
      isNewDepartment
        ? []
        : divisions.filter(
            (d) => String(d.department) === placement.departmentId,
          ),
    [divisions, isNewDepartment, placement.departmentId],
  );
  const selectedDivision = departmentDivisions.find(
    (d) => String(d.id) === placement.divisionId,
  );
  const divisionIsNew =
    isNewDepartment ||
    placement.divMode === "new" ||
    departmentDivisions.length === 0;
  const newDepartmentName = placement.newDepartment.trim();
  const matchingDepartment = isNewDepartment
    ? departments.find(
        (d) => d.name.toLowerCase() === newDepartmentName.toLowerCase(),
      )
    : null;

  return {
    isNewDepartment,
    selectedDepartment,
    departmentDivisions,
    divisionIsNew,
    matchingDepartment,
    departmentLabel: isNewDepartment
      ? newDepartmentName
      : selectedDepartment?.name,
    divisionLabel: divisionIsNew
      ? placement.newDivision.trim()
      : selectedDivision?.name,
  };
}
