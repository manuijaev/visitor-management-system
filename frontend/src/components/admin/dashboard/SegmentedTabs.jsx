import { SEGMENT, SEGMENT_COUNT, SEGMENTED } from "../styles";

const COLUMNS = {
  3: "max-[768px]:grid-cols-3",
  4: "max-[768px]:grid-cols-4",
};

export default function SegmentedTabs({ label, tabs, value, onChange }) {
  return (
    <div
      className={`${SEGMENTED} ${COLUMNS[tabs.length]}`}
      role="tablist"
      aria-label={label}
    >
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          className={SEGMENT}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          <span className={SEGMENT_COUNT}>{tab.count}</span>
        </button>
      ))}
    </div>
  );
}
