import Button from "../../ui/Button";
import Icon from "../Icon";

export default function RowTools({
  name,
  iconSize,
  revealClass,
  onRename,
  onDelete,
}) {
  return (
    <div
      className={`flex items-center justify-end gap-0.5 opacity-0 focus-within:opacity-100 [@media(hover:none)]:opacity-100 motion-safe:transition-opacity motion-safe:duration-150 ${revealClass}`}
    >
      <Button
        variant="icon-sm"
        onClick={onRename}
        aria-label={`Rename ${name}`}
      >
        <Icon name="edit" size={iconSize} />
      </Button>
      <Button
        variant="icon-danger"
        aria-label={`Delete ${name}`}
        onClick={onDelete}
      >
        <Icon name="trash" size={iconSize} />
      </Button>
    </div>
  );
}
