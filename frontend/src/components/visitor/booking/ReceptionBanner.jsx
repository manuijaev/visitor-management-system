import Icon from "../Icon";

export default function ReceptionBanner({ onTurnOff }) {
  return (
    <div className="flex items-center gap-2.5 rounded-t-[28px] bg-ink px-(--gp-pad) py-[11px] text-[13px] text-[#f3f0ec] max-[759px]:rounded-t-3xl">
      <Icon name="desk" className="size-[18px] text-gold-mid" />
      <span>Reception mode: checking in a visitor</span>
      <button
        type="button"
        className="ml-auto text-[13px] font-semibold text-gold-mid"
        onClick={onTurnOff}
      >
        Turn off
      </button>
    </div>
  );
}
