import { ICONS } from "./icons";

export default function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed top-5 right-5 z-[1001] flex items-center gap-3 rounded-xl bg-ink px-5 py-3.5 text-[14px] text-white [box-shadow:var(--shadow-lg)] motion-safe:animate-[slideIn_0.3s_ease]">
      <span>{message}</span>
      <button
        className="flex cursor-pointer items-center justify-center [border:none] bg-transparent p-0 text-white [&_svg]:size-4"
        onClick={onClose}
        aria-label="Dismiss"
      >
        {ICONS.x}
      </button>
    </div>
  );
}
