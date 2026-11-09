export default function SubLabel({ spaced, note, children }) {
  return (
    <p
      className={`mx-0 mb-2.5 flex justify-between gap-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-light ${spaced ? "mt-5" : "mt-0"}`}
    >
      {children}
      {note && (
        <span className="font-medium normal-case tracking-[0.02em] text-ink-faint">
          {note}
        </span>
      )}
    </p>
  );
}
