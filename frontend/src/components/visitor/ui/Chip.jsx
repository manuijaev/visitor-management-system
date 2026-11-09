import cx from "./cx";

export default function Chip({ on, className, ...rest }) {
  return (
    <button
      type="button"
      className={cx(
        "min-h-10 flex-none snap-start rounded-[999px] border-[1.5px] border-solid px-[15px] text-[13.5px] font-medium motion-safe:[transition:background_0.15s_ease,border-color_0.15s_ease,color_0.15s_ease]",
        on
          ? "border-ink bg-ink text-white"
          : "border-line bg-surface text-ink-mid hover:border-line-strong hover:text-ink",
        className,
      )}
      {...rest}
    />
  );
}
