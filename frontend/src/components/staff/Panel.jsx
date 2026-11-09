import cn from "../ui/cn";

export default function Panel({ icon, title, action, className, children }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-surface max-[768px]:p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
        <h3 className="flex items-center gap-2.5 text-[16px] font-semibold text-ink [&_svg]:size-[18px] [&_svg]:text-gold">
          {icon} {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function EmptyNote({ children }) {
  return (
    <div className="p-10 text-center text-[14px] text-ink-faint">
      {children}
    </div>
  );
}
