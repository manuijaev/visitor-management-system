import { useEffect, useRef } from "react";
import Field from "../Field";
import { INPUT, NOTE } from "../styles";
import OptionButton from "./OptionButton";

export default function DepartmentField({
  departments,
  placement,
  setPlacement,
  matchingDepartment,
}) {
  const chooseDepartment = (id) =>
    setPlacement((prev) => ({
      ...prev,
      deptMode: "existing",
      departmentId: String(id),
      divMode: "existing",
      divisionId: "",
      newDivision: "",
    }));

  const newDepartmentRef = useRef(null);
  const focusNewDepartment = useRef(false);

  useEffect(() => {
    if (!focusNewDepartment.current) return;
    focusNewDepartment.current = false;
    newDepartmentRef.current?.focus();
  });

  const chooseNewDepartment = () => {
    focusNewDepartment.current = true;
    setPlacement((prev) => ({
      ...prev,
      deptMode: "new",
      departmentId: "",
      divMode: "new",
      divisionId: "",
    }));
  };

  const isNew = placement.deptMode === "new";

  return (
    <Field as="div" label="Department">
      <div className="flex flex-wrap gap-2">
        {departments.map((d) => {
          const isSelected = !isNew && placement.departmentId === String(d.id);
          return (
            <OptionButton
              key={d.id}
              icon="building"
              selected={isSelected}
              onClick={() => chooseDepartment(d.id)}
            >
              {d.name}
            </OptionButton>
          );
        })}
        <OptionButton
          icon="plus"
          isNew
          selected={isNew}
          onClick={chooseNewDepartment}
        >
          New department
        </OptionButton>
      </div>
      {isNew && (
        <div className="mt-1 flex flex-col gap-1.5">
          <input
            className={INPUT}
            ref={newDepartmentRef}
            aria-label="New department name"
            value={placement.newDepartment}
            onChange={(e) =>
              setPlacement((prev) => ({
                ...prev,
                newDepartment: e.target.value,
              }))
            }
            placeholder="Department name, e.g. Finance"
          />
          {matchingDepartment && (
            <small className={NOTE}>
              {matchingDepartment.name} already exists, so we'll add them there.
            </small>
          )}
        </div>
      )}
    </Field>
  );
}
