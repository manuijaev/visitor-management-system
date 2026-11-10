import { Link } from "react-router-dom";
import cx from "./cx";

const ROW =
  "flex w-full items-center gap-3 rounded-[18px] border border-solid border-line bg-surface px-4 py-[15px] text-left text-ink no-underline hover:border-line-strong active:[transform:scale(0.99)] motion-safe:[transition:border-color_0.15s_ease,transform_0.15s_ease]";

export function RowText({ title, children }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
      <strong className="text-[15px] font-semibold">{title}</strong>
      {children}
    </span>
  );
}

export function RowSub({ className, children }) {
  return (
    <small className={cx("text-[13px] text-ink-light", className)}>
      {children}
    </small>
  );
}

export default function ListRow({ to, className, ...rest }) {
  if (to) {
    return <Link to={to} className={cx(ROW, className)} {...rest} />;
  }
  return <button type="button" className={cx(ROW, className)} {...rest} />;
}
