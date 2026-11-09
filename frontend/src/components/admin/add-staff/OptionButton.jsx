import Icon from "../Icon";

function optionTone(selected, isNew) {
  if (selected)
    return "border-gold bg-gold-light text-ink [&_svg]:text-gold-dark";
  if (isNew) return "border-line-strong text-ink-light [&_svg]:text-ink-faint";
  return "border-line text-ink-mid hover:border-line-strong [&_svg]:text-ink-faint";
}

export default function OptionButton({
  icon,
  selected,
  isNew = false,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-[12px] border-[1.5px] px-3.5 py-2.5 text-[14px] font-medium motion-safe:transition-[border-color,background] motion-safe:duration-150 ${isNew ? "border-dashed" : ""} ${optionTone(selected, isNew)}`}
      onClick={onClick}
    >
      <Icon name={icon} size={15} />
      {children}
    </button>
  );
}
