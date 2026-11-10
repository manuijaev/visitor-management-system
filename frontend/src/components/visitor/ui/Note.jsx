import Icon from "../Icon";
import cx from "./cx";

export default function Note({ icon, warn, children }) {
  return (
    <p
      className={cx(
        "mb-0 mt-3.5 flex gap-2.5 rounded-[14px] px-3.5 py-3 text-[13.5px] leading-normal",
        warn ? "bg-gold-light text-gold-dark" : "bg-surface-2 text-ink-mid",
      )}
    >
      <Icon name={icon} className="mt-px size-[18px]" />
      <span>{children}</span>
    </p>
  );
}
