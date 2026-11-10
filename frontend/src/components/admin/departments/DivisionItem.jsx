import Icon from "../Icon";
import InlineEdit from "./InlineEdit";
import RowTools from "./RowTools";

export default function DivisionItem({
  division,
  headcount,
  isEditing,
  onEdit,
  onCancelEdit,
  onRename,
  onDelete,
}) {
  return (
    <li className="group/division flex min-h-[42px] items-center gap-2.5 rounded-[10px] py-1 pr-1.5 pl-2.5 text-ink-faint hover:bg-surface-2">
      {isEditing ? (
        <InlineEdit
          value={division.name}
          label="Division name"
          onCancel={onCancelEdit}
          onSave={(name) => onRename(division, name)}
        />
      ) : (
        <>
          <Icon name="folder" size={14} />
          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] text-ink">
            {division.name}
          </span>
          <span className="min-w-6 rounded-[999px] bg-surface-2 px-[7px] py-px text-center text-[12px] font-semibold text-ink-light lining-nums group-hover/division:bg-surface">
            {headcount}
          </span>
          <RowTools
            name={division.name}
            iconSize={13}
            revealClass="group-hover/division:opacity-100"
            onRename={onEdit}
            onDelete={() => onDelete(division)}
          />
        </>
      )}
    </li>
  );
}
