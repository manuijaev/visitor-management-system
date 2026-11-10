import PasswordInput from "../PasswordInput";
import Input from "../ui/Input";

export default function AuthField({
  id,
  label,
  hint,
  password = false,
  className = "",
  ...inputProps
}) {
  const Control = password ? PasswordInput : Input;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        className="text-[11px] font-semibold tracking-[0.14em] text-ink-faint uppercase"
        htmlFor={id}
      >
        {label}
      </label>
      <Control id={id} {...inputProps} />
      {hint && (
        <div className="mt-[5px] text-[11px] text-ink-faint">{hint}</div>
      )}
    </div>
  );
}
