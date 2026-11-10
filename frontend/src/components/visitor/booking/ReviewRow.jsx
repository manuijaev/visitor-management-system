import Icon from "../Icon";

export default function ReviewRow({ icon, label, value, sub, onEdit }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 [&+&]:border-t [&+&]:border-line">
      <span className="grid size-9 flex-none place-items-center rounded-[11px] bg-surface-2 text-ink-mid">
        <Icon name={icon} className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
          {label}
        </span>
        <strong className="mt-0.5 block text-[15px] font-semibold [overflow-wrap:anywhere]">
          {value}
        </strong>
        {sub && (
          <small className="mt-px block text-[13px] text-ink-light [overflow-wrap:anywhere]">
            {sub}
          </small>
        )}
      </div>
      <button
        type="button"
        className="flex-none rounded-[9px] px-2.5 py-1.5 text-[13px] font-semibold text-gold-dark hover:bg-gold-light motion-safe:[transition:background_0.15s_ease]"
        onClick={onEdit}
      >
        Edit
      </button>
    </div>
  );
}
