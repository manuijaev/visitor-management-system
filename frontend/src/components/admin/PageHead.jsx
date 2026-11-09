import { SERIF } from "./styles";

export default function PageHead({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1
          className={`m-0 ${SERIF} text-[40px] font-bold leading-[1.05] text-ink max-[760px]:text-[32px] [&_em]:italic [&_em]:text-gold-dark`}
        >
          {title}
        </h1>
        <p className="mt-1.5 mb-0 text-[14px] text-ink-light">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
