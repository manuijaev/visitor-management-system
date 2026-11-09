import Icon from "../Icon";
import { STEPS } from "./constants";

function barClass(current, done) {
  if (current) {
    return "after:bg-ink after:[transform:scaleX(1)]";
  }
  if (done) {
    return "after:bg-gold after:[transform:scaleX(1)]";
  }
  return "after:bg-gold after:[transform:scaleX(0)]";
}

function labelColor(current, done) {
  if (current) {
    return "text-ink";
  }
  return done ? "text-ink-light" : "text-ink-faint";
}

export default function Stepper({ step, stepDone, canOpenStep, onGoTo }) {
  return (
    <ol className="mx-(--gp-pad) mb-0 mt-5 grid list-none grid-cols-[repeat(4,minmax(0,1fr))] gap-2 p-0">
      {STEPS.map((label, index) => {
        const current = index === step;
        const done = index < step && stepDone[index];
        return (
          <li key={label}>
            <button
              type="button"
              className="flex min-h-11 w-full flex-col items-start gap-2 text-left disabled:cursor-default"
              onClick={() => onGoTo(index)}
              disabled={!canOpenStep(index)}
              aria-current={current ? "step" : undefined}
            >
              <span
                className={`relative block h-1 w-full overflow-hidden rounded-[999px] bg-surface-2 after:absolute after:inset-0 after:origin-left after:rounded-[inherit] motion-safe:after:[transition:transform_0.35s_ease] ${barClass(current, done)}`}
              />
              <span
                className={`inline-flex items-center gap-[5px] text-[12.5px] font-semibold max-[519px]:text-[12px] ${labelColor(current, done)}`}
              >
                {done && <Icon name="check" className="size-3.5 text-green" />}
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
