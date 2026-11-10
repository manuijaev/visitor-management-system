export default function Field({
  label,
  optional,
  hint,
  error,
  full,
  as: Tag = "label",
  children,
}) {
  const message = error || hint;
  return (
    <Tag
      className={`flex min-w-0 flex-col gap-[7px] ${full ? "col-span-full" : ""}`}
    >
      <span className="flex items-baseline gap-1.5 text-[13px] font-semibold text-ink-mid">
        {label}
        {optional && (
          <small className="text-[12px] font-normal text-ink-faint">
            optional
          </small>
        )}
      </span>
      {children}
      {message && (
        <span
          className={`text-[12.5px] leading-[1.45] ${error ? "text-red" : "text-ink-light"}`}
        >
          {message}
        </span>
      )}
    </Tag>
  );
}
