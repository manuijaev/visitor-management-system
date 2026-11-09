import Field from "../Field";
import { INPUT, NOTE } from "../styles";
import OptionButton from "./OptionButton";

function DivisionOptions({ divisions, placement, setPlacement }) {
  return (
    <div className="flex flex-wrap gap-2">
      {divisions.map((d) => {
        const isSelected =
          placement.divMode === "existing" &&
          placement.divisionId === String(d.id);
        return (
          <OptionButton
            key={d.id}
            icon="folder"
            selected={isSelected}
            onClick={() =>
              setPlacement((prev) => ({
                ...prev,
                divMode: "existing",
                divisionId: String(d.id),
              }))
            }
          >
            {d.name}
          </OptionButton>
        );
      })}
      <OptionButton
        icon="plus"
        isNew
        selected={placement.divMode === "new"}
        onClick={() =>
          setPlacement((prev) => ({ ...prev, divMode: "new", divisionId: "" }))
        }
      >
        New division
      </OptionButton>
    </div>
  );
}

export default function DivisionField({
  placement,
  setPlacement,
  departmentDivisions,
  divisionIsNew,
  selectedDepartment,
}) {
  const emptyNote =
    placement.deptMode === "new"
      ? "A new department starts with its first division."
      : `${selectedDepartment?.name} has no divisions yet.`;

  return (
    <Field as="div" label="Division">
      {departmentDivisions.length > 0 ? (
        <DivisionOptions
          divisions={departmentDivisions}
          placement={placement}
          setPlacement={setPlacement}
        />
      ) : (
        <small className={NOTE}>{emptyNote}</small>
      )}
      {divisionIsNew && (
        <div className="mt-1 flex flex-col gap-1.5">
          <input
            className={INPUT}
            value={placement.newDivision}
            onChange={(e) =>
              setPlacement((prev) => ({
                ...prev,
                newDivision: e.target.value,
              }))
            }
            placeholder="Division name, e.g. Payroll"
          />
        </div>
      )}
    </Field>
  );
}
