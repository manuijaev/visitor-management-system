import Icon from "../Icon";
import { BARE_INPUT } from "../styles";

export default function SearchField({ value, onChange, placeholder }) {
  return (
    <label className="flex min-w-[260px] flex-[0_1_340px] items-center gap-2 rounded-[12px] border-[1.5px] border-line bg-surface-2 px-3 text-ink-faint focus-within:border-gold focus-within:bg-surface max-[760px]:min-w-0 max-[760px]:flex-[1_1_100%] motion-safe:transition-[border-color,background] motion-safe:duration-150">
      <Icon name="search" size={15} />
      <input
        className={`${BARE_INPUT} text-ink`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
