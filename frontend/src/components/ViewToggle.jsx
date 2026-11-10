import { ToggleGroup, ToggleGroupItem } from "./ui/ToggleGroup";

const ITEM =
  "flex size-8 items-center justify-center rounded-md border-none bg-transparent px-3 py-[11px] font-[inherit] text-[15px] font-semibold text-ink-faint [box-shadow:var(--shadow-soft)] hover:-translate-y-px data-[state=on]:bg-surface data-[state=on]:text-ink max-[480px]:size-10 in-data-[console=admin]:p-0 in-data-[console=admin]:[font-size:inherit] in-data-[console=admin]:[line-height:inherit] in-data-[console=admin]:[font-weight:inherit] in-data-[console=admin]:hover:translate-y-0 in-data-[console=admin]:data-[state=off]:[box-shadow:none] motion-safe:transition-[transform,background,border-color,box-shadow,color] motion-safe:duration-150 [&_svg]:size-[18px]";

export default function ViewToggle({ value, onChange }) {
  return (
    <ToggleGroup
      asChild
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
    >
      <fieldset className="m-0 rounded-lg border-none bg-surface-2 p-0.5 in-data-[toolbar]:max-[768px]:ml-auto">
        <legend className="sr-only">Layout</legend>
        <ToggleGroupItem value="grid" aria-label="Card view" className={ITEM}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="List view" className={ITEM}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </ToggleGroupItem>
      </fieldset>
    </ToggleGroup>
  );
}
