import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import cn from "./cn";

export function ToggleGroup({ className, ...props }) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn("flex min-w-0", className)}
      {...props}
    />
  );
}

export function ToggleGroupItem({ className, ...props }) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn("cursor-pointer", className)}
      {...props}
    />
  );
}
