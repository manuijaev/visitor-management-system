import Field from "../Field";
import Icon from "../Icon";
import { FIELD_HINT, FORM, INPUT, LEAD, NOTE } from "../styles";

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

export default function DetailsStep({
  details,
  setDetails,
  nameRef,
  onSubmit,
}) {
  const updateDetails = (field) => (e) =>
    setDetails((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form className={FORM} onSubmit={onSubmit} noValidate>
      <p className={LEAD}>
        Start with the essentials. They'll get an email to set their own
        password.
      </p>
      <Field label="Full name">
        <input
          className={INPUT}
          ref={nameRef}
          value={details.full_name}
          onChange={updateDetails("full_name")}
          placeholder="e.g. Jane Wanjiru"
          autoComplete="off"
        />
      </Field>
      <Field label="Work email">
        <input
          className={INPUT}
          type="email"
          value={details.email}
          onChange={updateDetails("email")}
          placeholder="jane@school.ac.ke"
          autoComplete="off"
        />
      </Field>
      <Field
        label={
          <>
            Phone <em className={FIELD_HINT}>recommended</em>
          </>
        }
      >
        <input
          className={INPUT}
          type="tel"
          value={details.phone}
          onChange={updateDetails("phone")}
          placeholder="+254 700 000 000"
          autoComplete="off"
        />
        <small className={NOTE}>
          They'll get an SMS when a visitor arrives, even without internet.
        </small>
      </Field>
      <Field as="div" label="Access">
        <div className="grid grid-cols-2 gap-2.5 max-[760px]:grid-cols-1">
          {ROLE_OPTIONS.map((option) => {
            const isSelected = details.role === option.value;
            return (
              <button
                type="button"
                key={option.value}
                className={`flex flex-col items-start gap-1 rounded-[14px] border-[1.5px] px-4 py-3.5 text-left motion-safe:transition-[border-color,background] motion-safe:duration-150 ${isSelected ? "border-gold bg-gold-light text-gold-dark [box-shadow:0_0_0_3px_rgba(201,146,42,0.12)]" : "border-line text-ink-light hover:border-line-strong"}`}
                onClick={() =>
                  setDetails((prev) => ({ ...prev, role: option.value }))
                }
                aria-pressed={isSelected}
              >
                <Icon name={option.icon} size={18} />
                <strong className="mt-1 text-[15px] text-ink">
                  {option.title}
                </strong>
                <small className="text-[12.5px] leading-[1.4] text-ink-faint">
                  {option.text}
                </small>
              </button>
            );
          })}
        </div>
      </Field>
      <button type="submit" hidden />
    </form>
  );
}
