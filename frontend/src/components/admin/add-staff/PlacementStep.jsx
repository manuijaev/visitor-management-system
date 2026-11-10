import { FORM, LEAD } from "../styles";
import { firstName } from "../utils";
import DepartmentField from "./DepartmentField";
import DivisionField from "./DivisionField";

export default function PlacementStep({
  details,
  placement,
  setPlacement,
  departments,
  departmentDivisions,
  divisionIsNew,
  selectedDepartment,
  matchingDepartment,
}) {
  const showDivision =
    placement.deptMode === "new" || Boolean(placement.departmentId);

  return (
    <div className={FORM}>
      <p className={LEAD}>
        Where will {firstName(details.full_name)} work? Pick an existing
        department or create one now.
      </p>
      <DepartmentField
        departments={departments}
        placement={placement}
        setPlacement={setPlacement}
        matchingDepartment={matchingDepartment}
      />
      {showDivision && (
        <DivisionField
          placement={placement}
          setPlacement={setPlacement}
          departmentDivisions={departmentDivisions}
          divisionIsNew={divisionIsNew}
          selectedDepartment={selectedDepartment}
        />
      )}
    </div>
  );
}
