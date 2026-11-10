import { useState } from "react";
import Card from "../Card";
import Icon from "../Icon";
import { BARE_INPUT, LINK_BUTTON, SERIF } from "../styles";
import RowTools from "./RowTools";
import DivisionItem from "./DivisionItem";
import InlineEdit from "./InlineEdit";

function plural(count, singular, pluralForm) {
  return count === 1 ? singular : pluralForm;
}

export default function DepartmentCard({
  department,
  divisions,
  headcount,
  divisionHeadcount,
  editing,
  setEditing,
  onRenameDepartment,
  onRenameDivision,
  onDeleteDepartment,
  onDeleteDivision,
  onCreateDivision,
  onAddStaff,
}) {
  const [newDivision, setNewDivision] = useState("");
  const stopEditing = () => setEditing(null);

  const createDivision = async (e) => {
    e.preventDefault();
    const name = newDivision.trim();
    if (!name) return;
    if (await onCreateDivision(name, department.id)) setNewDivision("");
  };

  return (
    <Card className="group/card flex flex-col gap-3 p-5">
      <header className="flex items-start justify-between gap-2.5">
        {editing === `dept-${department.id}` ? (
          <InlineEdit
            value={department.name}
            label="Department name"
            onCancel={stopEditing}
            onSave={(name) => onRenameDepartment(department, name)}
          />
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-gold-light text-[12.5px] text-ink-light">
                <Icon name="building" size={16} />
              </span>
              <div>
                <h3
                  className={`m-0 ${SERIF} text-[23px] font-bold leading-[1.1]`}
                >
                  {department.name}
                </h3>
                <span className="text-[12.5px] text-ink-light">
                  {headcount} {plural(headcount, "person", "people")} ·{" "}
                  {divisions.length}{" "}
                  {plural(divisions.length, "division", "divisions")}
                </span>
              </div>
            </div>
            <RowTools
              name={department.name}
              iconSize={14}
              revealClass="group-hover/card:opacity-100"
              onRename={() => setEditing(`dept-${department.id}`)}
              onDelete={() =>
                onDeleteDepartment(department, divisions.length, headcount)
              }
            />
          </>
        )}
      </header>

      <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
        {divisions.map((div) => (
          <DivisionItem
            key={div.id}
            division={div}
            headcount={divisionHeadcount.get(div.id) ?? 0}
            isEditing={editing === `div-${div.id}`}
            onEdit={() => setEditing(`div-${div.id}`)}
            onCancelEdit={stopEditing}
            onRename={onRenameDivision}
            onDelete={onDeleteDivision}
          />
        ))}
      </ul>

      <form
        className="flex items-center gap-2 rounded-[12px] border-[1.5px] border-dashed border-line-strong px-3 text-ink-faint focus-within:border-solid focus-within:border-gold"
        onSubmit={createDivision}
      >
        <Icon name="plus" size={14} />
        <input
          className={BARE_INPUT}
          value={newDivision}
          onChange={(e) => setNewDivision(e.target.value)}
          placeholder="Add a division"
          aria-label={`Add a division to ${department.name}`}
        />
      </form>

      <button
        type="button"
        className={`${LINK_BUTTON} mt-auto self-start`}
        onClick={() => onAddStaff(department.id)}
      >
        <Icon name="userPlus" size={14} />
        Add staff to {department.name}
      </button>
    </Card>
  );
}
