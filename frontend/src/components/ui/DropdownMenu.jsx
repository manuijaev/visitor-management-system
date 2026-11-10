import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import cn from "./cn";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 6,
  ...props
}) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[1000] min-w-[230px] rounded-[14px] border border-line bg-surface p-1.5 [box-shadow:var(--shadow-float)] motion-safe:animate-[adPop_0.14s_ease]",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

const ITEM_LOOKS = {
  default: {
    base: "flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] outline-none",
    plain:
      "text-ink-mid data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink",
    danger: "text-red data-[highlighted]:bg-red-light",
  },
  profile: {
    base: "block w-full cursor-pointer rounded-lg p-2.5 text-left text-[14px] font-semibold outline-none data-[highlighted]:bg-surface-2",
    plain: "text-ink",
    danger: "text-red",
  },
};

export function DropdownMenuItem({
  className,
  tone,
  look = "default",
  ...props
}) {
  const styles = ITEM_LOOKS[look];
  return (
    <DropdownPrimitive.Item
      className={cn(
        styles.base,
        tone === "danger" ? styles.danger : styles.plain,
        className,
      )}
      {...props}
    />
  );
}

export const DropdownMenuSeparator = DropdownPrimitive.Separator;
