import * as SwitchPrimitive from "@radix-ui/react-switch";
import cn from "./cn";

export default function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative h-5 w-[34px] flex-none cursor-pointer rounded-[999px] border-none bg-ink-faint p-0 [box-shadow:none] data-[state=checked]:bg-green motion-safe:transition-[background] motion-safe:duration-200",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="absolute top-0.5 left-0.5 block size-4 rounded-[50%] bg-white [box-shadow:0_1px_3px_rgba(0,0,0,0.25)] data-[state=checked]:left-4 motion-safe:transition-[left] motion-safe:duration-200" />
    </SwitchPrimitive.Root>
  );
}
