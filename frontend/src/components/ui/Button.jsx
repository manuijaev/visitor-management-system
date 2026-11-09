import { forwardRef } from "react";
import cn from "./cn";

const BASE = "cursor-pointer font-[inherit]";

const BLOCK =
  "w-full border-[1.5px] font-semibold hover:-translate-y-px disabled:translate-y-0 disabled:cursor-wait disabled:opacity-55";

const PLAIN = `${BLOCK} rounded-[10px] px-3 py-[11px] text-[15px] [box-shadow:var(--shadow-soft)]`;

const COMPACT =
  "inline-flex w-auto items-center justify-center gap-2 whitespace-nowrap border-[1.5px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors motion-safe:duration-150";

const COMPACT_MD = "rounded-[12px] px-[18px] py-2.5 text-[14px]";

const COMPACT_SM = "rounded-[10px] px-3.5 py-[7px] text-[13px]";

const ICON =
  "inline-flex shrink-0 items-center justify-center border-none bg-transparent p-0 text-ink-light disabled:cursor-wait disabled:opacity-55 motion-safe:transition-colors motion-safe:duration-150";

const RESPOND_BASE =
  "flex-1 rounded-lg px-3.5 py-2.5 text-[13px] font-semibold motion-safe:transition-[background-color,border-color,color,box-shadow,transform,opacity] motion-safe:duration-200";

const RESPOND = `${RESPOND_BASE} [border:none]`;

const VARIANTS = {
  primary: `${BLOCK} rounded-[12px] border-ink bg-ink px-6 py-3.5 text-[15px] text-white [box-shadow:0_4px_16px_rgba(26,23,20,0.2)] hover:border-black hover:bg-black hover:[box-shadow:0_6px_20px_rgba(26,23,20,0.28)]`,
  secondary: `${PLAIN} border-line-strong bg-surface text-ink hover:border-ink`,
  muted: `${PLAIN} border-line-strong bg-surface-2 text-ink-light hover:border-ink hover:text-ink`,
  danger: `${PLAIN} border-red bg-red text-white hover:border-red-dark hover:bg-red-dark`,
  solid: `${COMPACT} ${COMPACT_MD} border-transparent bg-ink text-white hover:bg-ink-mid`,
  "solid-sm": `${COMPACT} ${COMPACT_SM} border-transparent bg-ink text-white hover:bg-ink-mid`,
  accent: `${COMPACT} ${COMPACT_MD} border-transparent bg-gold-strong text-white hover:bg-gold-dark`,
  outline: `${COMPACT} ${COMPACT_MD} border-line-strong bg-surface text-ink hover:border-ink`,
  "outline-sm": `${COMPACT} ${COMPACT_SM} border-line-strong bg-surface text-ink hover:border-ink`,
  icon: `${ICON} size-10 rounded-[12px] hover:bg-surface-2 hover:text-ink`,
  "icon-sm": `${ICON} size-8 rounded-[10px] hover:bg-surface-2 hover:text-ink`,
  "icon-danger": `${ICON} size-8 rounded-[10px] hover:bg-red-light hover:text-red`,
  accept: `${RESPOND} bg-green text-white hover:bg-(--green-dark)`,
  decline: `${RESPOND} bg-red-light text-(--red-dark) hover:bg-red hover:text-white`,
  reschedule: `${RESPOND} bg-gold-light text-gold-dark hover:bg-gold-strong hover:text-white`,
  subtle: `${RESPOND_BASE} border border-line bg-surface-2 text-ink-mid hover:bg-line`,
  "sd-icon":
    "relative flex size-9 items-center justify-center rounded-lg border-none bg-transparent p-0 text-ink-mid [box-shadow:var(--shadow-soft)] hover:-translate-y-px hover:bg-surface-2 hover:text-ink [&_svg]:size-5 max-[768px]:[&_svg]:size-[18px] motion-safe:transition-all motion-safe:duration-200",
};

const Button = forwardRef(function Button(
  { variant = "secondary", type = "button", className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(BASE, VARIANTS[variant], className)}
      {...props}
    />
  );
});

export default Button;
