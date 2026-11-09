import Icon from "../Icon";
import { VISIT_MODES } from "./constants";

const MODE =
  "relative flex min-h-[136px] flex-col items-start gap-3.5 rounded-[20px] border-[1.5px] border-solid p-4 text-left disabled:opacity-45 [&:hover:not(:disabled)]:border-line-strong [&:hover:not(:disabled)]:[box-shadow:0_2px_8px_rgba(26,23,20,0.07)] max-[519px]:min-h-0 max-[519px]:flex-row max-[519px]:items-center max-[519px]:px-3.5 max-[519px]:py-[13px] motion-safe:[transition:border-color_0.2s_ease,box-shadow_0.2s_ease,background_0.2s_ease]";
const MODE_ON = "border-ink bg-bg [box-shadow:0_0_0_3px_rgba(201,146,42,0.2)]";
const MODE_OFF = "border-line bg-surface";
const CHECK =
  "absolute right-3 top-3 grid size-[22px] place-items-center rounded-[50%] bg-gold text-white max-[519px]:right-3.5 max-[519px]:top-1/2 motion-safe:[transition:opacity_0.2s_ease,transform_0.2s_ease]";
const CHECK_ON =
  "opacity-100 [transform:none] max-[519px]:[transform:translateY(-50%)]";
const CHECK_OFF =
  "opacity-0 [transform:scale(0.6)] max-[519px]:[transform:translateY(-50%)_scale(0.6)]";

export default function VisitModePicker({ mode, host, onSelect }) {
  const hostAway = Boolean(host && !host.available);
  return (
    <div
      className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2.5 max-[519px]:grid-cols-[minmax(0,1fr)]"
      role="radiogroup"
      aria-label="Visit type"
    >
      {VISIT_MODES.map((option) => {
        const on = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={on}
            className={`${MODE} ${on ? MODE_ON : MODE_OFF}`}
            disabled={option.id !== "later" && hostAway}
            onClick={() => onSelect(option.id)}
          >
            <span
              className={`grid size-[42px] place-items-center rounded-[13px] motion-safe:[transition:background_0.2s_ease,color_0.2s_ease] ${on ? "bg-ink text-gold-mid" : "bg-surface-2 text-ink"}`}
            >
              <Icon name={option.icon} />
            </span>
            <span>
              <strong className="block text-[15px] font-semibold">
                {option.title}
              </strong>
              <small className="mt-[3px] block text-[12.5px] leading-[1.35] text-ink-light">
                {option.sub}
              </small>
            </span>
            <span className={`${CHECK} ${on ? CHECK_ON : CHECK_OFF}`}>
              <Icon name="check" className="size-[13px] stroke-[2.6]" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
