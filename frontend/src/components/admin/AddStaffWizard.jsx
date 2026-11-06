import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api';
import Icon from './Icon';
import { firstName, formatApiError } from './utils';

const STEPS = ['Details', 'Department', 'Review'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyDetails = { full_name: '', email: '', phone: '', role: 'Staff' };

function initialPlacement(departments, presetDepartmentId) {
  if (presetDepartmentId) {
    return { deptMode: 'existing', departmentId: String(presetDepartmentId), newDepartment: '', divMode: 'existing', divisionId: '', newDivision: '' };
  }
  return {
    deptMode: departments.length ? 'existing' : 'new',
    departmentId: '',
    newDepartment: '',
    divMode: 'existing',
    divisionId: '',
    newDivision: '',
  };
}

export default function AddStaffWizard({ open, onClose, onCreated, departments, divisions, staff, presetDepartmentId }) {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState(emptyDetails);
  const [placement, setPlacement] = useState(() => initialPlacement(departments, presetDepartmentId));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDetails(emptyDetails);
    setPlacement(initialPlacement(departments, presetDepartmentId));
    setError('');
    setResult(null);
    setCopied(false);
    setTimeout(() => nameRef.current?.focus(), 50);
    // Reset only when the drawer opens; department list refreshes must not wipe the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetDepartmentId]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, submitting]);

  const existingEmails = useMemo(() => new Set(staff.map((s) => s.email.toLowerCase())), [staff]);

  const selectedDepartment = departments.find((d) => String(d.id) === placement.departmentId);
  const departmentDivisions = useMemo(
    () => (placement.deptMode === 'existing' ? divisions.filter((d) => String(d.department) === placement.departmentId) : []),
    [divisions, placement.deptMode, placement.departmentId]
  );
  const selectedDivision = departmentDivisions.find((d) => String(d.id) === placement.divisionId);
  const divisionIsNew = placement.deptMode === 'new' || placement.divMode === 'new' || departmentDivisions.length === 0;

  const matchingDepartment = placement.deptMode === 'new'
    ? departments.find((d) => d.name.toLowerCase() === placement.newDepartment.trim().toLowerCase())
    : null;

  if (!open) return null;

  const updateDetails = (field) => (e) => setDetails((prev) => ({ ...prev, [field]: e.target.value }));

  const chooseDepartment = (id) => {
    setPlacement((prev) => ({ ...prev, deptMode: 'existing', departmentId: String(id), divMode: 'existing', divisionId: '', newDivision: '' }));
  };

  const chooseNewDepartment = () => {
    setPlacement((prev) => ({ ...prev, deptMode: 'new', departmentId: '', divMode: 'new', divisionId: '' }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!details.full_name.trim()) return 'Enter the staff member\'s full name.';
      if (!EMAIL_PATTERN.test(details.email.trim())) return 'Enter a valid email address.';
      if (existingEmails.has(details.email.trim().toLowerCase())) return 'Someone with this email is already on the team.';
    }
    if (step === 1) {
      if (placement.deptMode === 'existing' && !placement.departmentId) return 'Choose a department, or create a new one.';
      if (placement.deptMode === 'new' && !placement.newDepartment.trim()) return 'Name the new department.';
      if (divisionIsNew && !placement.newDivision.trim()) return 'Name the division they will work in.';
      if (!divisionIsNew && !placement.divisionId) return 'Choose a division, or create a new one.';
    }
    return '';
  };

  const goNext = (e) => {
    e?.preventDefault();
    const message = validateStep();
    setError(message);
    if (!message) setStep((s) => s + 1);
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    const payload = {
      full_name: details.full_name.trim(),
      email: details.email.trim().toLowerCase(),
      phone: details.phone.trim(),
      role: details.role,
    };
    if (placement.deptMode === 'existing') payload.department = Number(placement.departmentId);
    else payload.department_name = placement.newDepartment.trim();
    if (divisionIsNew) payload.division_name = placement.newDivision.trim();
    else payload.division = Number(placement.divisionId);

    try {
      const { data } = await api.post('/staff/create/', payload);
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
    setError('');
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  const departmentLabel = placement.deptMode === 'new' ? placement.newDepartment.trim() : selectedDepartment?.name;
  const divisionLabel = divisionIsNew ? placement.newDivision.trim() : selectedDivision?.name;

  return (
    <div className="ad-drawer-overlay" onClick={() => !submitting && onClose()}>
      <aside className="ad-drawer" role="dialog" aria-modal="true" aria-labelledby="add-staff-title" onClick={(e) => e.stopPropagation()}>
        <header className="ad-drawer-head">
          <div>
            <div className="ad-eyebrow">Team</div>
            <h2 id="add-staff-title">Add staff member</h2>
          </div>
          <button type="button" className="ad-icon-btn" onClick={onClose} aria-label="Close" disabled={submitting}>
            <Icon name="x" size={18} />
          </button>
        </header>

        {step < 3 && (
          <ol className="ad-steps">
            {STEPS.map((label, index) => (
              <li key={label} className={index === step ? 'current' : index < step ? 'done' : ''}>
                <span className="ad-step-dot">{index < step ? <Icon name="check" size={12} strokeWidth={3} /> : index + 1}</span>
                <span className="ad-step-label">{label}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="ad-drawer-body">
          {step === 0 && (
            <form className="ad-form" onSubmit={goNext} noValidate>
              <p className="ad-lead">Start with the essentials. They'll get an email to set their own password.</p>
              <label className="ad-field">
                <span>Full name</span>
                <input ref={nameRef} value={details.full_name} onChange={updateDetails('full_name')} placeholder="e.g. Jane Wanjiru" autoComplete="off" />
              </label>
              <label className="ad-field">
                <span>Work email</span>
                <input type="email" value={details.email} onChange={updateDetails('email')} placeholder="jane@company.com" autoComplete="off" />
              </label>
              <label className="ad-field">
                <span>Phone <em>recommended</em></span>
                <input type="tel" value={details.phone} onChange={updateDetails('phone')} placeholder="+254 700 000 000" autoComplete="off" />
                <small>They'll get an SMS when a visitor arrives, even without internet.</small>
              </label>
              <div className="ad-field">
                <span>Access</span>
                <div className="ad-choice-row">
                  {[
                    { value: 'Staff', icon: 'user', title: 'Staff', text: 'Receives and responds to visitors' },
                    { value: 'Admin', icon: 'shield', title: 'Admin', text: 'Manages the team and settings' },
                  ].map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      className={`ad-choice ${details.role === option.value ? 'selected' : ''}`}
                      onClick={() => setDetails((prev) => ({ ...prev, role: option.value }))}
                      aria-pressed={details.role === option.value}
                    >
                      <Icon name={option.icon} size={18} />
                      <strong>{option.title}</strong>
                      <small>{option.text}</small>
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" hidden aria-hidden="true" />
            </form>
          )}

          {step === 1 && (
            <div className="ad-form">
              <p className="ad-lead">Where will {firstName(details.full_name)} work? Pick an existing department or create one now.</p>

              <div className="ad-field">
                <span>Department</span>
                <div className="ad-option-grid">
                  {departments.map((d) => (
                    <button
                      type="button"
                      key={d.id}
                      className={`ad-option ${placement.deptMode === 'existing' && placement.departmentId === String(d.id) ? 'selected' : ''}`}
                      onClick={() => chooseDepartment(d.id)}
                    >
                      <Icon name="building" size={15} />
                      {d.name}
                    </button>
                  ))}
                  <button type="button" className={`ad-option ad-option-new ${placement.deptMode === 'new' ? 'selected' : ''}`} onClick={chooseNewDepartment}>
                    <Icon name="plus" size={15} />
                    New department
                  </button>
                </div>
                {placement.deptMode === 'new' && (
                  <div className="ad-inline-create">
                    <input
                      autoFocus
                      value={placement.newDepartment}
                      onChange={(e) => setPlacement((prev) => ({ ...prev, newDepartment: e.target.value }))}
                      placeholder="Department name, e.g. Finance"
                    />
                    {matchingDepartment && <small>{matchingDepartment.name} already exists, so we'll add them there.</small>}
                  </div>
                )}
              </div>

              {(placement.deptMode === 'new' || placement.departmentId) && (
                <div className="ad-field">
                  <span>Division</span>
                  {!divisionIsNew || departmentDivisions.length > 0 ? (
                    <div className="ad-option-grid">
                      {departmentDivisions.map((d) => (
                        <button
                          type="button"
                          key={d.id}
                          className={`ad-option ${placement.divMode === 'existing' && placement.divisionId === String(d.id) ? 'selected' : ''}`}
                          onClick={() => setPlacement((prev) => ({ ...prev, divMode: 'existing', divisionId: String(d.id) }))}
                        >
                          <Icon name="folder" size={15} />
                          {d.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={`ad-option ad-option-new ${placement.divMode === 'new' ? 'selected' : ''}`}
                        onClick={() => setPlacement((prev) => ({ ...prev, divMode: 'new', divisionId: '' }))}
                      >
                        <Icon name="plus" size={15} />
                        New division
                      </button>
                    </div>
                  ) : (
                    <small className="ad-muted-note">
                      {placement.deptMode === 'new' ? 'A new department starts with its first division.' : `${selectedDepartment?.name} has no divisions yet.`}
                    </small>
                  )}
                  {divisionIsNew && (
                    <div className="ad-inline-create">
                      <input
                        value={placement.newDivision}
                        onChange={(e) => setPlacement((prev) => ({ ...prev, newDivision: e.target.value }))}
                        placeholder="Division name, e.g. Payroll"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="ad-form">
              <p className="ad-lead">Check the details, then send the invite.</p>
              <dl className="ad-summary">
                <div><dt>Name</dt><dd>{details.full_name.trim()}</dd></div>
                <div><dt>Email</dt><dd>{details.email.trim().toLowerCase()}</dd></div>
                {details.phone.trim() && <div><dt>Phone</dt><dd>{details.phone.trim()}</dd></div>}
                <div><dt>Access</dt><dd>{details.role}</dd></div>
                <div>
                  <dt>Department</dt>
                  <dd>{departmentLabel}{placement.deptMode === 'new' && !matchingDepartment && <span className="ad-tag">new</span>}</dd>
                </div>
                <div>
                  <dt>Division</dt>
                  <dd>{divisionLabel}{divisionIsNew && <span className="ad-tag">new</span>}</dd>
                </div>
              </dl>
              <div className="ad-callout">
                <Icon name="mail" size={18} />
                <p>
                  We'll email <strong>{details.email.trim().toLowerCase()}</strong> a secure link. {firstName(details.full_name)} sets a password and lands
                  straight in their dashboard.
                </p>
              </div>
            </div>
          )}

          {step === 3 && result && (
            <div className="ad-done">
              <div className={`ad-done-icon ${result.invite.email_sent ? '' : 'warn'}`}>
                <Icon name={result.invite.email_sent ? 'check' : 'mail'} size={28} strokeWidth={2.5} />
              </div>
              <h3>{result.invite.email_sent ? 'Invite sent' : `${firstName(result.staff.full_name)}'s account is ready`}</h3>
              {result.invite.email_sent ? (
                <p>
                  We emailed <strong>{result.staff.email}</strong> a link to set their password. It expires in {result.invite.expires_in_hours} hours.
                </p>
              ) : (
                <p>
                  The invite email couldn't be delivered, so share this link with {firstName(result.staff.full_name)} directly. It expires in{' '}
                  {result.invite.expires_in_hours} hours.
                </p>
              )}
              <div className="ad-copy-field">
                <input readOnly value={result.invite.invite_url} onFocus={(e) => e.target.select()} aria-label="Invite link" />
                <button type="button" className="ad-btn ad-btn-ghost" onClick={copyLink}>
                  <Icon name={copied ? 'check' : 'copy'} size={14} />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="ad-placement-line">
                {result.staff.department_name} · {result.staff.division_name} · {result.staff.role}
              </p>
            </div>
          )}

          {error && <p className="ad-error">{error}</p>}
        </div>

        <footer className="ad-drawer-foot">
          {step === 3 ? (
            <>
              <button type="button" className="ad-btn ad-btn-ghost" onClick={addAnother}>
                <Icon name="userPlus" size={15} />
                Add another
              </button>
              <button type="button" className="ad-btn ad-btn-primary" onClick={onClose}>Done</button>
            </>
          ) : (
            <>
              <button type="button" className="ad-btn ad-btn-ghost" onClick={step === 0 ? onClose : goBack} disabled={submitting}>
                {step === 0 ? 'Cancel' : (<><Icon name="arrowLeft" size={15} />Back</>)}
              </button>
              {step < 2 ? (
                <button type="button" className="ad-btn ad-btn-primary" onClick={goNext}>
                  Continue
                  <Icon name="arrowRight" size={15} />
                </button>
              ) : (
                <button type="button" className="ad-btn ad-btn-primary" onClick={submit} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create & send invite'}
                </button>
              )}
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}
