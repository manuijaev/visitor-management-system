import { Link } from "react-router-dom";
import cx from "./cx";

const BASE =
  "inline-flex min-h-[52px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[15px] font-semibold no-underline [&:active:not(:disabled)]:[transform:scale(0.98)] disabled:border-transparent disabled:bg-line disabled:text-ink-faint disabled:opacity-100 disabled:[box-shadow:none] motion-safe:[transition:background_0.2s_ease,color_0.2s_ease,border-color_0.2s_ease,box-shadow_0.2s_ease,transform_0.12s_ease]";

const VARIANTS = {
  dark: "bg-ink text-white [box-shadow:0_12px_26px_-14px_rgba(26,23,20,0.7)] [&:hover:not(:disabled)]:bg-black",
  gold: "bg-gold text-white [box-shadow:0_12px_26px_-12px_rgba(201,146,42,0.75)] [&:hover:not(:disabled)]:bg-gold-dark",
  ghost:
    "border-[1.5px] border-solid border-line-strong bg-surface text-ink [&:hover:not(:disabled)]:border-ink [&:hover:not(:disabled)]:bg-bg",
};

export function buttonClass({ variant = "dark", iconOnly, grow, className }) {
  return cx(
    BASE,
    VARIANTS[variant],
    iconOnly ? "w-[52px]" : "px-[22px]",
    grow && "flex-1",
    className,
  );
}

export default function Button({
  variant,
  iconOnly,
  grow,
  className,
  to,
  type = "button",
  ...rest
}) {
  const classes = buttonClass({ variant, iconOnly, grow, className });
  if (to) {
    return <Link to={to} className={classes} {...rest} />;
  }
  return <button type={type} className={classes} {...rest} />;
}
