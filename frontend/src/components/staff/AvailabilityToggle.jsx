import * as SwitchPrimitive from "@radix-ui/react-switch";

const PILL =
  "group relative inline-flex h-9 w-auto flex-[0_0_auto] cursor-pointer items-center gap-2 overflow-hidden rounded-[999px] border py-0 pr-3.5 pl-1.5 text-[12px] font-semibold uppercase [box-shadow:none] hover:enabled:[box-shadow:0_3px_10px_rgba(26,23,20,0.12)] hover:enabled:[transform:translateY(-1px)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-(--green-dim) data-[state=checked]:bg-green-light data-[state=checked]:text-green data-[state=unchecked]:border-(--red-dim) data-[state=unchecked]:bg-red-light data-[state=unchecked]:text-red motion-safe:transition-[background-color,border-color,color,box-shadow,transform,opacity] motion-safe:duration-300";

export default function AvailabilityToggle({
  isAvailable,
  isSaving,
  onToggle,
}) {
  return (
    <SwitchPrimitive.Root
      className={PILL}
      checked={isAvailable}
      onCheckedChange={() => onToggle()}
      disabled={isSaving}
      title={
        isAvailable
          ? "Tap to mark yourself away"
          : "Tap to mark yourself available"
      }
    >
      <span
        className="relative h-5 w-[34px] flex-none rounded-[999px] bg-green group-data-[state=unchecked]:bg-ink-faint motion-safe:transition-[background] motion-safe:duration-200"
        aria-hidden="true"
      >
        <SwitchPrimitive.Thumb className="absolute top-0.5 left-4 size-4 rounded-[50%] bg-white [box-shadow:0_1px_3px_rgba(0,0,0,0.25)] data-[state=unchecked]:left-0.5 motion-safe:transition-[left] motion-safe:duration-200" />
      </span>
      <span className="tracking-[0.08em] max-[760px]:tracking-[0.04em]">
        {isAvailable ? "Available" : "Away"}
      </span>
    </SwitchPrimitive.Root>
  );
}
