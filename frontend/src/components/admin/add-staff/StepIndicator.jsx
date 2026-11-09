import Icon from "../Icon";

const STEPS = ["Details", "Department", "Review"];

const ITEM_TONES = {
  current: "border-gold text-ink",
  done: "border-gold text-ink-light",
  upcoming: "border-line text-ink-faint",
};

const DOT_TONES = {
  current: "bg-ink text-white",
  done: "bg-gold-strong text-white",
  upcoming: "bg-surface-2",
};

function stepState(index, step) {
  if (index === step) return "current";
  if (index < step) return "done";
  return "upcoming";
}

export default function StepIndicator({ step }) {
  return (
    <ol className="mx-7 mt-3 mb-0 flex list-none gap-2 p-0 max-[760px]:mx-5">
      {STEPS.map((label, index) => {
        const state = stepState(index, step);
        return (
          <li
            key={label}
            aria-current={state === "current" ? "step" : undefined}
            className={`flex flex-1 items-center gap-2 border-t-[3px] pt-3 text-[13px] font-semibold motion-safe:transition-[border-color,color] motion-safe:duration-200 ${ITEM_TONES[state]}`}
          >
            <span
              className={`inline-flex size-[22px] items-center justify-center rounded-[999px] text-[11px] lining-nums ${DOT_TONES[state]}`}
            >
              {index < step ? (
                <Icon name="check" size={12} strokeWidth={3} />
              ) : (
                index + 1
              )}
            </span>
            <span className="max-[760px]:hidden">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
