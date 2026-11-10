import cx from "./cx";

const BASE =
  "w-full rounded-[14px] border-[1.5px] border-solid bg-bg font-[inherit] text-[16px] text-ink outline-none placeholder:text-ink-faint focus:bg-surface focus:[box-shadow:0_0_0_4px_rgba(201,146,42,0.14)] focus:outline-none motion-safe:[transition:border-color_0.15s_ease,background_0.15s_ease,box-shadow_0.15s_ease]";

export function inputClass({ invalid, multiline, className } = {}) {
  return cx(
    BASE,
    invalid
      ? "border-red hover:border-red focus:border-red"
      : "border-line hover:border-line-strong focus:border-gold",
    multiline
      ? "min-h-[92px] resize-y px-[15px] py-3 leading-normal"
      : "min-h-[50px] py-0",
    className || (!multiline && "px-[15px]"),
  );
}

export default function TextInput({ invalid, className, ...rest }) {
  return <input className={inputClass({ invalid, className })} {...rest} />;
}
