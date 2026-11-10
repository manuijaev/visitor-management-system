const BASE =
  "min-h-[42px] rounded-[999px] border border-solid px-[18px] py-0 font-sans text-[14px] font-medium leading-none active:[transform:scale(0.97)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-safe:[transition:transform_0.15s_ease,background_0.15s_ease]";

const VARIANTS = {
  primary: "border-ink bg-ink text-bg",
  ghost:
    "border-line bg-transparent text-ink hover:border-ink hover:bg-surface-2",
};

export default function PwaButton({
  variant = "ghost",
  className = "",
  ...rest
}) {
  return (
    <button
      type="button"
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  );
}
