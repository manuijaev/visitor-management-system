import { useEffect, useMemo, useRef, useState } from "react";
import { isValidEmail } from "../../services/validation";
import api from "../../services/api";
import ModalDialog from "../ModalDialog";
import Icon from "./Icon";
import { firstName, formatApiError } from "./utils";

const STEPS = ["Details", "Department", "Review"];

const ROLE_OPTIONS = [
  {
    value: "Staff",
    icon: "user",
    title: "Staff",
    text: "Receives and responds to visitors",
  },
  {
    value: "Admin",
    icon: "shield",
    title: "Admin",
    text: "Manages the team and settings",
  },
];

const emptyDetails = { full_name: "", email: "", phone: "", role: "Staff" };

export function initialPlacement(departments, presetDepartmentId) {
  const hasPreset = Boolean(presetDepartmentId);
  return {
    deptMode: hasPreset || departments.length ? "existing" : "new",
    departmentId: hasPreset ? String(presetDepartmentId) : "",
    newDepartment: "",
    divMode: "existing",
    divisionId: "",
    newDivision: "",
  };
}

export function validateDetails(details, existingEmails) {
  if (!details.full_name.trim()) return "Enter the staff member's full name.";
  if (!isValidEmail(details.email)) return "Enter a valid email address.";
  if (existingEmails.has(details.email.trim().toLowerCase()))
    return "Someone with this email is already on the team.";
  return "";
}

export function validatePlacement(placement, divisionIsNew) {
  if (placement.deptMode === "existing" && !placement.departmentId)
    return "Choose a department, or create a new one.";
  if (placement.deptMode === "new" && !placement.newDepartment.trim())
    return "Name the new department.";
  if (divisionIsNew && !placement.newDivision.trim())
    return "Name the division they will work in.";
  if (!divisionIsNew && !placement.divisionId)
    return "Choose a division, or create a new one.";
  return "";
}

export function buildPayload(details, placement, divisionIsNew) {
  const payload = {
    full_name: details.full_name.trim(),
    email: details.email.trim().toLowerCase(),
    phone: details.phone.trim(),
    role: details.role,
  };
  if (placement.deptMode === "existing")
    payload.department = Number(placement.departmentId);
  else payload.department_name = placement.newDepartment.trim();
  if (divisionIsNew) payload.division_name = placement.newDivision.trim();
  else payload.division = Number(placement.divisionId);
  return payload;
}

function stepState(index, step) {
  if (index === step) return "current";
  if (index < step) return "done";
  return "";
}

function StepIndicator({ step }) {
  return (
    <ol className="ad-steps">
      {STEPS.map((label, index) => (
        <li key={label} className={stepState(index, step)}>
          <span className="ad-step-dot">
            {index < step ? (
              <Icon name="check" size={12} strokeWidth={3} />
            ) : (
              index + 1
            )}
          </span>
          <span className="ad-step-label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

function DetailsStep({ details, setDetails, nameRef, onSubmit }) {
  const updateDetails = (field) => (e) =>
    setDetails((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form className="ad-form" onSubmit={onSubmit} noValidate>
      <p className="ad-lead">
        Start with the essentials. They'll get an email to set their own
        password.
      </p>
      <label className="ad-field">
        <span>Full name</span>
        <input
          ref={nameRef}
          value={details.full_name}
          onChange={updateDetails("full_name")}
          placeholder="e.g. Jane Wanjiru"
          autoComplete="off"
        />
      </label>
      <label className="ad-field">
        <span>Work email</span>
        <input
          type="email"
          value={details.email}
          onChange={updateDetails("email")}
          placeholder="jane@school.ac.ke"
          autoComplete="off"
        />
      </label>
      <label className="ad-field">
        <span>
          Phone <em>recommended</em>
        </span>
        <input
          type="tel"
          value={details.phone}
          onChange={updateDetails("phone")}
          placeholder="+254 700 000 000"
          autoComplete="off"
        />
        <small>
          They'll get an SMS when a visitor arrives, even without internet.
        </small>
      </label>
      <div className="ad-field">
        <span>Access</span>
        <div className="ad-choice-row">
          {ROLE_OPTIONS.map((option) => {
            const isSelected = details.role === option.value;
            return (
              <button
                type="button"
                key={option.value}
                className={`ad-choice ${isSelected ? "selected" : ""}`}
                onClick={() =>
                  setDetails((prev) => ({ ...prev, role: option.value }))
                }
                aria-pressed={isSelected}
              >
                <Icon name={option.icon} size={18} />
                <strong>{option.title}</strong>
                <small>{option.text}</small>
              </button>
            );
          })}
        </div>
      </div>
      <button type="submit" hidden />
    </form>
  );
}

function DepartmentField({
  departments,
  placement,
  setPlacement,
  matchingDepartment,
}) {
  const chooseDepartment = (id) =>
    setPlacement((prev) => ({
      ...prev,
      deptMode: "existing",
      departmentId: String(id),
      divMode: "existing",
      divisionId: "",
      newDivision: "",
    }));

  const newDepartmentRef = useRef(null);
  const focusNewDepartment = useRef(false);

  useEffect(() => {
    if (!focusNewDepartment.current) return;
    focusNewDepartment.current = false;
    newDepartmentRef.current?.focus();
  });

  const chooseNewDepartment = () => {
    focusNewDepartment.current = true;
    setPlacement((prev) => ({
      ...prev,
      deptMode: "new",
      departmentId: "",
      divMode: "new",
      divisionId: "",
    }));
  };

  const isNew = placement.deptMode === "new";

  return (
    <div className="ad-field">
      <span>Department</span>
      <div className="ad-option-grid">
        {departments.map((d) => {
          const isSelected = !isNew && placement.departmentId === String(d.id);
          return (
            <button
              type="button"
              key={d.id}
              className={`ad-option ${isSelected ? "selected" : ""}`}
              onClick={() => chooseDepartment(d.id)}
            >
              <Icon name="building" size={15} />
              {d.name}
            </button>
          );
        })}
        <button
          type="button"
          className={`ad-option ad-option-new ${isNew ? "selected" : ""}`}
          onClick={chooseNewDepartment}
        >
          <Icon name="plus" size={15} />
          New department
        </button>
      </div>
      {isNew && (
        <div className="ad-inline-create">
          <input
            ref={newDepartmentRef}
            aria-label="New department name"
            value={placement.newDepartment}
            onChange={(e) =>
              setPlacement((prev) => ({
                ...prev,
                newDepartment: e.target.value,
              }))
            }
            placeholder="Department name, e.g. Finance"
          />
          {matchingDepartment && (
            <small>
              {matchingDepartment.name} already exists, so we'll add them there.
            </small>
          )}
        </div>
      )}
    </div>
  );
}

function DivisionOptions({ divisions, placement, setPlacement }) {
  return (
    <div className="ad-option-grid">
      {divisions.map((d) => {
        const isSelected =
          placement.divMode === "existing" &&
          placement.divisionId === String(d.id);
        return (
          <button
            type="button"
            key={d.id}
            className={`ad-option ${isSelected ? "selected" : ""}`}
            onClick={() =>
              setPlacement((prev) => ({
                ...prev,
                divMode: "existing",
                divisionId: String(d.id),
              }))
            }
          >
            <Icon name="folder" size={15} />
            {d.name}
          </button>
        );
      })}
      <button
        type="button"
        className={`ad-option ad-option-new ${placement.divMode === "new" ? "selected" : ""}`}
        onClick={() =>
          setPlacement((prev) => ({ ...prev, divMode: "new", divisionId: "" }))
        }
      >
        <Icon name="plus" size={15} />
        New division
      </button>
    </div>
  );
}

function DivisionField({
  placement,
  setPlacement,
  departmentDivisions,
  divisionIsNew,
  selectedDepartment,
}) {
  const emptyNote =
    placement.deptMode === "new"
      ? "A new department starts with its first division."
      : `${selectedDepartment?.name} has no divisions yet.`;

  return (
    <div className="ad-field">
      <span>Division</span>
      {departmentDivisions.length > 0 ? (
        <DivisionOptions
          divisions={departmentDivisions}
          placement={placement}
          setPlacement={setPlacement}
        />
      ) : (
        <small className="ad-muted-note">{emptyNote}</small>
      )}
      {divisionIsNew && (
        <div className="ad-inline-create">
          <input
            value={placement.newDivision}
            onChange={(e) =>
              setPlacement((prev) => ({
                ...prev,
                newDivision: e.target.value,
              }))
            }
            placeholder="Division name, e.g. Payroll"
          />
        </div>
      )}
    </div>
  );
}

function PlacementStep({
  details,
  placement,
  setPlacement,
  departments,
  departmentDivisions,
  divisionIsNew,
  selectedDepartment,
  matchingDepartment,
}) {
  const showDivision =
    placement.deptMode === "new" || Boolean(placement.departmentId);

  return (
    <div className="ad-form">
      <p className="ad-lead">
        Where will {firstName(details.full_name)} work? Pick an existing
        department or create one now.
      </p>
      <DepartmentField
        departments={departments}
        placement={placement}
        setPlacement={setPlacement}
        matchingDepartment={matchingDepartment}
      />
      {showDivision && (
        <DivisionField
          placement={placement}
          setPlacement={setPlacement}
          departmentDivisions={departmentDivisions}
          divisionIsNew={divisionIsNew}
          selectedDepartment={selectedDepartment}
        />
      )}
    </div>
  );
}

function ReviewStep({
  details,
  departmentLabel,
  departmentIsNew,
  divisionLabel,
  divisionIsNew,
}) {
  const email = details.email.trim().toLowerCase();
  const phone = details.phone.trim();

  return (
    <div className="ad-form">
      <p className="ad-lead">Check the details, then send the invite.</p>
      <dl className="ad-summary">
        <div>
          <dt>Name</dt>
          <dd>{details.full_name.trim()}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{email}</dd>
        </div>
        {phone && (
          <div>
            <dt>Phone</dt>
            <dd>{phone}</dd>
          </div>
        )}
        <div>
          <dt>Access</dt>
          <dd>{details.role}</dd>
        </div>
        <div>
          <dt>Department</dt>
          <dd>
            {departmentLabel}
            {departmentIsNew && <span className="ad-tag">new</span>}
          </dd>
        </div>
        <div>
          <dt>Division</dt>
          <dd>
            {divisionLabel}
            {divisionIsNew && <span className="ad-tag">new</span>}
          </dd>
        </div>
      </dl>
      <div className="ad-callout">
        <Icon name="mail" size={18} />
        <p>
          We'll email <strong>{email}</strong> a secure link.{" "}
          {firstName(details.full_name)} sets a password and lands straight in
          their dashboard.
        </p>
      </div>
    </div>
  );
}

function DoneStep({ result, copied, onCopy }) {
  const { invite, staff } = result;
  const name = firstName(staff.full_name);

  return (
    <div className="ad-done">
      <div className={`ad-done-icon ${invite.email_sent ? "" : "warn"}`}>
        <Icon
          name={invite.email_sent ? "check" : "mail"}
          size={28}
          strokeWidth={2.5}
        />
      </div>
      {invite.email_sent ? (
        <>
          <h3>Invite sent</h3>
          <p>
            We emailed <strong>{staff.email}</strong> a link to set their
            password. It expires in {invite.expires_in_hours} hours.
          </p>
        </>
      ) : (
        <>
          <h3>{name}'s account is ready</h3>
          <p>
            The invite email couldn't be delivered, so share this link with{" "}
            {name} directly. It expires in {invite.expires_in_hours} hours.
          </p>
        </>
      )}
      <div className="ad-copy-field">
        <input
          readOnly
          value={invite.invite_url}
          onFocus={(e) => e.target.select()}
          aria-label="Invite link"
        />
        <button type="button" className="ad-btn ad-btn-ghost" onClick={onCopy}>
          <Icon name={copied ? "check" : "copy"} size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="ad-placement-line">
        {staff.department_name} · {staff.division_name} · {staff.role}
      </p>
    </div>
  );
}

function WizardFooter({
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
      <footer className="ad-drawer-foot">
        <button
          type="button"
          className="ad-btn ad-btn-ghost"
          onClick={onAddAnother}
        >
          <Icon name="userPlus" size={15} />
          Add another
        </button>
        <button
          type="button"
          className="ad-btn ad-btn-primary"
          onClick={onClose}
        >
          Done
        </button>
      </footer>
    );
  }

  const isFirstStep = step === 0;
  return (
    <footer className="ad-drawer-foot">
      <button
        type="button"
        className="ad-btn ad-btn-ghost"
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
      </button>
      {step < 2 ? (
        <button
          type="button"
          className="ad-btn ad-btn-primary"
          onClick={onNext}
        >
          Continue
          <Icon name="arrowRight" size={15} />
        </button>
      ) : (
        <button
          type="button"
          className="ad-btn ad-btn-primary"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create & send invite"}
        </button>
      )}
    </footer>
  );
}

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

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDetails(emptyDetails);
    setPlacement(initialPlacement(departments, presetDepartmentId));
    setError("");
    setResult(null);
    setCopied(false);
    setTimeout(() => nameRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetDepartmentId]);

  const existingEmails = useMemo(
    () => new Set(staff.map((s) => s.email.toLowerCase())),
    [staff],
  );

  const isNewDepartment = placement.deptMode === "new";
  const selectedDepartment = departments.find(
    (d) => String(d.id) === placement.departmentId,
  );
  const departmentDivisions = useMemo(
    () =>
      isNewDepartment
        ? []
        : divisions.filter(
            (d) => String(d.department) === placement.departmentId,
          ),
    [divisions, isNewDepartment, placement.departmentId],
  );
  const selectedDivision = departmentDivisions.find(
    (d) => String(d.id) === placement.divisionId,
  );
  const divisionIsNew =
    isNewDepartment ||
    placement.divMode === "new" ||
    departmentDivisions.length === 0;
  const newDepartmentName = placement.newDepartment.trim();
  const matchingDepartment = isNewDepartment
    ? departments.find(
        (d) => d.name.toLowerCase() === newDepartmentName.toLowerCase(),
      )
    : null;

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

  const addAnother = () => {
    setStep(0);
    setDetails(emptyDetails);
    setPlacement(initialPlacement(departments, presetDepartmentId));
    setResult(null);
    setError("");
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  return (
    <ModalDialog
      className="ad-drawer"
      aria-labelledby="add-staff-title"
      onClose={onClose}
      dismissible={!submitting}
    >
      <header className="ad-drawer-head">
        <div>
          <div className="ad-eyebrow">Team</div>
          <h2 id="add-staff-title">Add staff member</h2>
        </div>
        <button
          type="button"
          className="ad-icon-btn"
          onClick={onClose}
          aria-label="Close"
          disabled={submitting}
        >
          <Icon name="x" size={18} />
        </button>
      </header>

      {step < 3 && <StepIndicator step={step} />}

      <div className="ad-drawer-body">
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
            departmentDivisions={departmentDivisions}
            divisionIsNew={divisionIsNew}
            selectedDepartment={selectedDepartment}
            matchingDepartment={matchingDepartment}
          />
        )}
        {step === 2 && (
          <ReviewStep
            details={details}
            departmentLabel={
              isNewDepartment ? newDepartmentName : selectedDepartment?.name
            }
            departmentIsNew={isNewDepartment && !matchingDepartment}
            divisionLabel={
              divisionIsNew
                ? placement.newDivision.trim()
                : selectedDivision?.name
            }
            divisionIsNew={divisionIsNew}
          />
        )}
        {step === 3 && result && (
          <DoneStep result={result} copied={copied} onCopy={copyLink} />
        )}
        {error && <p className="ad-error">{error}</p>}
      </div>

      <WizardFooter
        step={step}
        submitting={submitting}
        onClose={onClose}
        onBack={goBack}
        onNext={goNext}
        onSubmit={submit}
        onAddAnother={addAnother}
      />
    </ModalDialog>
  );
}
