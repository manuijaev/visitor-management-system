import { STAT, STAT_LABEL, STAT_NOTE, STAT_VALUE } from "../styles";

export default function GateStatButton({
  label,
  value,
  highlight = false,
  note,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`${STAT} w-full cursor-pointer text-left hover:border-[rgba(201,146,42,0.5)] max-[768px]:p-3 motion-safe:transition-[border-color,box-shadow] motion-safe:duration-150`}
      onClick={onClick}
    >
      <span className={STAT_LABEL}>{label}</span>
      <strong
        className={`${STAT_VALUE} ${highlight ? "text-gold-dark" : "text-ink"}`}
      >
        {value}
      </strong>
      <small className={`${STAT_NOTE} max-[768px]:hidden`}>{note}</small>
    </button>
  );
}
