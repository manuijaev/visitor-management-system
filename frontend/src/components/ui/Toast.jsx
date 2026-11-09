const TONES = {
  success: "border-l-[#3da86a]",
  error: "border-l-red",
};

export default function Toast({ tone = "success", children }) {
  if (!children) return null;
  return (
    <div
      className={`fixed right-[18px] bottom-[18px] z-[1200] max-w-[420px] min-w-60 rounded-xl border border-l-[3px] border-ink bg-ink px-4 py-3 text-[14px] text-[#f9f7f4] [box-shadow:var(--shadow-float)] max-[640px]:inset-x-3 max-[640px]:bottom-3 max-[640px]:max-w-none motion-safe:animate-[toastIn_0.35s_ease_forwards] ${TONES[tone]}`}
    >
      {children}
    </div>
  );
}
