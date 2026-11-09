import Chip from "../ui/Chip";

export default function ChoiceChips({
  options,
  selected,
  onSelect,
  renderLabel,
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Chip
          key={option}
          aria-pressed={selected === option}
          on={selected === option}
          onClick={() => onSelect(option)}
        >
          {renderLabel ? renderLabel(option) : option}
        </Chip>
      ))}
    </div>
  );
}
