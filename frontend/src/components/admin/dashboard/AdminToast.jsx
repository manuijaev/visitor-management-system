export default function AdminToast({ toast }) {
  if (!toast) return null;
  const tone = toast.type === "error" ? "border-l-red" : "border-l-[#3da86a]";
  return (
    <div
      className={`fixed top-[70px] right-5 z-[9999] max-w-[360px] rounded-[12px] border border-l-[3px] border-ink bg-ink px-5 py-3 text-[13px] text-[#f9f7f4] [box-shadow:var(--shadow-float)] motion-safe:animate-[slideIn_0.3s_ease] ${tone}`}
    >
      {toast.msg}
    </div>
  );
}
