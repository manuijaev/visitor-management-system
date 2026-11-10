import CopyField from "../CopyField";
import Icon from "../Icon";
import { SERIF } from "../styles";
import { firstName } from "../utils";

const TEXT = "m-0 max-w-[400px] leading-[1.55]";

export default function DoneStep({ result, copied, onCopy }) {
  const { invite, staff } = result;
  const name = firstName(staff.full_name);
  const tone = invite.email_sent
    ? "bg-green-light text-green"
    : "bg-gold-light text-gold-dark";

  return (
    <div className="flex flex-col items-center gap-2.5 px-1 pt-6 pb-2 text-center">
      <div
        className={`inline-flex size-[68px] items-center justify-center rounded-[999px] motion-safe:animate-[adPop_0.3s_ease] ${tone}`}
      >
        <Icon
          name={invite.email_sent ? "check" : "mail"}
          size={28}
          strokeWidth={2.5}
        />
      </div>
      <h3 className={`mt-1.5 mb-0 ${SERIF} text-[30px] font-bold`}>
        {invite.email_sent ? "Invite sent" : `${name}'s account is ready`}
      </h3>
      {invite.email_sent ? (
        <p className={`${TEXT} text-[14.5px] text-ink-light`}>
          We emailed <strong>{staff.email}</strong> a link to set their
          password. It expires in {invite.expires_in_hours} hours.
        </p>
      ) : (
        <p className={`${TEXT} text-[14.5px] text-ink-light`}>
          The invite email couldn't be delivered, so share this link with {name}{" "}
          directly. It expires in {invite.expires_in_hours} hours.
        </p>
      )}
      <CopyField value={invite.invite_url} label="Invite link" onCopy={onCopy}>
        <Icon name={copied ? "check" : "copy"} size={14} />
        {copied ? "Copied" : "Copy"}
      </CopyField>
      <p className={`${TEXT} text-[13px] text-ink-faint`}>
        {staff.department_name} · {staff.division_name} · {staff.role}
      </p>
    </div>
  );
}
