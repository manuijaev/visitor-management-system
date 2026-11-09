import Icon from "../Icon";
import Button from "../ui/Button";
import { REVIEW_STEP } from "./constants";
import { submitLabel } from "./visit";

const STEP_READY = [(flow) => flow.whenOk, (flow) => flow.hostOk];

export default function FlowFooter({ flow }) {
  const { step } = flow;
  const { submitting } = flow.submission;
  const blocked = STEP_READY[step] ? !STEP_READY[step](flow) : false;

  return (
    <footer className="sticky bottom-(--gp-foot-bottom) z-[2] flex gap-2.5 rounded-b-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0),#fff_34%)] px-(--gp-pad) pb-(--gp-foot-pb) pt-[18px] max-[759px]:rounded-b-3xl max-[759px]:pt-3.5">
      {step > 0 && (
        <Button
          variant="ghost"
          iconOnly
          onClick={flow.goBack}
          aria-label="Back"
        >
          <Icon name="arrowLeft" />
        </Button>
      )}
      {step < REVIEW_STEP ? (
        <Button grow onClick={flow.goNext} disabled={blocked}>
          Continue
          <Icon name="arrowRight" />
        </Button>
      ) : (
        <Button variant="gold" grow onClick={flow.submit} disabled={submitting}>
          {submitting ? "Sending…" : submitLabel(flow.mode, flow.hostFirst)}
          {!submitting && <Icon name="arrowRight" />}
        </Button>
      )}
    </footer>
  );
}
