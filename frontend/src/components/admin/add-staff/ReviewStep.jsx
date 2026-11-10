import Icon from "../Icon";
import { FORM, LEAD } from "../styles";
import { firstName } from "../utils";

function NewTag() {
  return (
    <span className="rounded-[999px] bg-gold-light px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-gold-dark">
      new
    </span>
  );
}

function SummaryRow({ term, children }) {
  return (
    <div className="flex justify-between gap-4 py-3 [&+&]:border-t [&+&]:border-line-strong [&+&]:[--tw-border-style:dashed]">
      <dt className="text-[13.5px] text-ink-light">{term}</dt>
      <dd className="m-0 flex items-center gap-2 text-right text-[14px] font-semibold text-ink [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  );
}

export default function ReviewStep({
  details,
  departmentLabel,
  departmentIsNew,
  divisionLabel,
  divisionIsNew,
}) {
  const email = details.email.trim().toLowerCase();
  const phone = details.phone.trim();

  return (
    <div className={FORM}>
      <p className={LEAD}>Check the details, then send the invite.</p>
      <dl className="m-0 rounded-[16px] bg-surface-2 px-[18px] py-1">
        <SummaryRow term="Name">{details.full_name.trim()}</SummaryRow>
        <SummaryRow term="Email">{email}</SummaryRow>
        {phone && <SummaryRow term="Phone">{phone}</SummaryRow>}
        <SummaryRow term="Access">{details.role}</SummaryRow>
        <SummaryRow term="Department">
          {departmentLabel}
          {departmentIsNew && <NewTag />}
        </SummaryRow>
        <SummaryRow term="Division">
          {divisionLabel}
          {divisionIsNew && <NewTag />}
        </SummaryRow>
      </dl>
      <div className="flex gap-3 rounded-[14px] border border-[#ecd3a4] bg-gold-light px-4 py-3.5 text-gold-dark">
        <Icon name="mail" size={18} className="mt-0.5 shrink-0" />
        <p className="m-0 text-[13.5px] leading-[1.55] text-ink-mid">
          We'll email <strong>{email}</strong> a secure link.{" "}
          {firstName(details.full_name)} sets a password and lands straight in
          their dashboard.
        </p>
      </div>
    </div>
  );
}
