export default function AccountList({ rows }) {
  return (
    <dl className="mx-[22px] my-0">
      {rows.map(([term, value]) => (
        <div
          key={term}
          className="flex items-baseline justify-between gap-4 border-b border-b-line py-3.5 last:[border-bottom:none] max-[480px]:flex-col max-[480px]:gap-0.5"
        >
          <dt className="text-[14px] text-ink-light">{term}</dt>
          <dd className="m-0 text-right text-[14px] font-medium text-ink max-[480px]:text-left">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
