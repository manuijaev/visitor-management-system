import BookingStep from "./BookingStep";
import FlowFooter from "./FlowFooter";
import Stepper from "./Stepper";
import Eyebrow from "../ui/Eyebrow";
import { STEP_TITLES, STEPS } from "./constants";

export default function BookingWizard({
  flow,
  data,
  receptionMode,
  officeOpen,
  greeting,
}) {
  const titles = receptionMode ? STEP_TITLES.reception : STEP_TITLES.visitor;
  return (
    <>
      <header className="flex items-start justify-between gap-4 px-(--gp-pad) pt-[26px] max-[759px]:pt-[22px]">
        <div>
          {greeting && (
            <p className="mx-0 mb-2.5 mt-0 font-['Cormorant_Garamond',serif] text-[19px] italic text-ink-mid">
              {greeting}
            </p>
          )}
          <Eyebrow>
            Step {flow.step + 1} of {STEPS.length}
          </Eyebrow>
          <h2
            id="gp-flow-title"
            className="m-0 font-['Cormorant_Garamond',serif] text-[clamp(1.7rem,2.6vw,2.1rem)] font-semibold leading-[1.08]"
          >
            {titles[flow.step]}
          </h2>
        </div>
      </header>

      <Stepper
        step={flow.step}
        stepDone={flow.stepDone}
        canOpenStep={flow.canOpenStep}
        onGoTo={flow.goToStep}
      />

      <div
        className="px-(--gp-pad) pb-2 pt-[22px] max-[759px]:pt-[18px] motion-safe:animate-[gp-step-in_0.35s_ease_both]"
        key={flow.step}
      >
        <BookingStep
          flow={flow}
          data={data}
          receptionMode={receptionMode}
          officeOpen={officeOpen}
        />
      </div>

      <FlowFooter flow={flow} />
    </>
  );
}
