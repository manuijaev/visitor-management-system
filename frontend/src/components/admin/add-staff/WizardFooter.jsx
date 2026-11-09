import Button from "../../ui/Button";
import Icon from "../Icon";

export default function WizardFooter({
  step,
  submitting,
  onClose,
  onBack,
  onNext,
  onSubmit,
  onAddAnother,
}) {
  if (step === 3) {
    return (
      <footer className="contents max-[760px]:px-5">
        <Button variant="outline" onClick={onAddAnother}>
          <Icon name="userPlus" size={15} />
          Add another
        </Button>
        <Button variant="solid" onClick={onClose}>
          Done
        </Button>
      </footer>
    );
  }

  const isFirstStep = step === 0;
  return (
    <footer className="contents max-[760px]:px-5">
      <Button
        variant="outline"
        onClick={isFirstStep ? onClose : onBack}
        disabled={submitting}
      >
        {isFirstStep ? (
          "Cancel"
        ) : (
          <>
            <Icon name="arrowLeft" size={15} />
            Back
          </>
        )}
      </Button>
      {step < 2 ? (
        <Button variant="solid" onClick={onNext}>
          Continue
          <Icon name="arrowRight" size={15} />
        </Button>
      ) : (
        <Button variant="solid" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Creating..." : "Create & send invite"}
        </Button>
      )}
    </footer>
  );
}
