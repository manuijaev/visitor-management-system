import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api";
import Dialog from "../ui/Dialog";
import ModalHead from "./dashboard/ModalHead";
import { ERROR } from "./styles";
import { formatApiError } from "./utils";
import DetailsStep from "./add-staff/DetailsStep";
import DoneStep from "./add-staff/DoneStep";
import PlacementStep from "./add-staff/PlacementStep";
import ReviewStep from "./add-staff/ReviewStep";
import StepIndicator from "./add-staff/StepIndicator";
import WizardFooter from "./add-staff/WizardFooter";
import usePlacementSummary from "./add-staff/usePlacementSummary";
import {
  buildPayload,
  emptyDetails,
  initialPlacement,
  validateDetails,
  validatePlacement,
} from "./add-staff/staffForm";

export default function AddStaffWizard({
  open,
  onClose,
  onCreated,
  departments,
  divisions,
  staff,
  presetDepartmentId,
}) {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState(emptyDetails);
  const [placement, setPlacement] = useState(() =>
    initialPlacement(departments, presetDepartmentId),
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const nameRef = useRef(null);

  const resetForm = () => {
    setStep(0);
    setDetails(emptyDetails);
    setPlacement(initialPlacement(departments, presetDepartmentId));
    setResult(null);
    setError("");
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  useEffect(() => {
    if (!open) return;
    resetForm();
    setCopied(false);
  }, [open, presetDepartmentId]);

  const existingEmails = useMemo(
    () => new Set(staff.map((s) => s.email.toLowerCase())),
    [staff],
  );

  const summary = usePlacementSummary(placement, departments, divisions);
  const { divisionIsNew } = summary;

  if (!open) return null;

  const validateStep = () => {
    if (step === 0) return validateDetails(details, existingEmails);
    if (step === 1) return validatePlacement(placement, divisionIsNew);
    return "";
  };

  const goNext = (e) => {
    e?.preventDefault();
    const message = validateStep();
    setError(message);
    if (!message) setStep((s) => s + 1);
  };

  const goBack = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post(
        "/staff/create/",
        buildPayload(details, placement, divisionIsNew),
      );
      setResult(data);
      setStep(3);
      onCreated?.(data.staff);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(result.invite.invite_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog
      look="drawer"
      className="gp-root"
      onClose={onClose}
      dismissible={!submitting}
    >
      <ModalHead
        eyebrow="Team"
        title="Add staff member"
        onClose={onClose}
        closeDisabled={submitting}
        drawer
      />

      {step < 3 && <StepIndicator step={step} />}

      <div className="flex-1 overflow-y-auto px-7 py-[22px] max-[760px]:px-5">
        {step === 0 && (
          <DetailsStep
            details={details}
            setDetails={setDetails}
            nameRef={nameRef}
            onSubmit={goNext}
          />
        )}
        {step === 1 && (
          <PlacementStep
            details={details}
            placement={placement}
            setPlacement={setPlacement}
            departments={departments}
            departmentDivisions={summary.departmentDivisions}
            divisionIsNew={divisionIsNew}
            selectedDepartment={summary.selectedDepartment}
            matchingDepartment={summary.matchingDepartment}
          />
        )}
        {step === 2 && (
          <ReviewStep
            details={details}
            departmentLabel={summary.departmentLabel}
            departmentIsNew={
              summary.isNewDepartment && !summary.matchingDepartment
            }
            divisionLabel={summary.divisionLabel}
            divisionIsNew={divisionIsNew}
          />
        )}
        {step === 3 && result && (
          <DoneStep result={result} copied={copied} onCopy={copyLink} />
        )}
        {error && <p className={ERROR}>{error}</p>}
      </div>

      <WizardFooter
        step={step}
        submitting={submitting}
        onClose={onClose}
        onBack={goBack}
        onNext={goNext}
        onSubmit={submit}
        onAddAnother={resetForm}
      />
    </Dialog>
  );
}
