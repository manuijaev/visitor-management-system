export default function AuthForm({
  as: Element = "form",
  error,
  children,
  ...props
}) {
  return (
    <Element
      className="flex flex-col gap-4 [transform:translateY(12px)] motion-safe:animate-[cardIn_0.55s_ease_forwards] motion-safe:opacity-0"
      {...props}
    >
      {children}
      {error && (
        <p className="m-0 rounded-[10px] border border-[#f1c0ba] bg-red-light px-3.5 py-2.5 text-[13px] text-red">
          {error}
        </p>
      )}
    </Element>
  );
}
