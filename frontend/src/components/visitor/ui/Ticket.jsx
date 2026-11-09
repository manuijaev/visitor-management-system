import cx from "./cx";

export default function Ticket({ items, className, children }) {
  return (
    <div
      className={cx(
        "relative rounded-[20px] border-[1.5px] border-solid border-line bg-bg text-left",
        className,
      )}
    >
      <dl className="m-0 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-4 gap-y-3.5 p-[18px] max-[519px]:grid-cols-[minmax(0,1fr)]">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              {item.label}
            </dt>
            <dd className="mx-0 mb-0 mt-[3px] text-[15px] font-semibold [overflow-wrap:anywhere]">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {children}
    </div>
  );
}
