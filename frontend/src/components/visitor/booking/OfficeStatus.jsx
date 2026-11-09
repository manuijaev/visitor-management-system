export default function OfficeStatus({ open }) {
  return (
    <span
      className={`inline-flex items-center gap-[7px] whitespace-nowrap rounded-[999px] px-[11px] py-1.5 text-[12px] font-semibold before:size-[7px] before:rounded-[50%] before:bg-current max-[759px]:px-[9px] max-[759px]:py-[5px] max-[759px]:text-[11px] ${open ? "bg-green-light text-green motion-safe:before:animate-[gp-blink_2s_ease-in-out_infinite]" : "bg-surface-2 text-ink-light"}`}
    >
      {open ? "School open" : "School closed"}
    </span>
  );
}
