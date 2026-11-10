import { forwardRef } from "react";
import cn from "./cn";

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[10px] border-[1.5px] border-line bg-surface-2 px-4 py-3 font-[inherit] text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-gold focus:bg-surface focus:[box-shadow:0_0_0_3px_rgba(201,146,42,0.12)] motion-safe:transition-[border-color,background,box-shadow] motion-safe:duration-150",
        className,
      )}
      {...props}
    />
  );
});

export default Input;
