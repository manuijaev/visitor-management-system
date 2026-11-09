import LogoMark from "../LogoMark";

export const PWA_SURFACE =
  "border border-solid border-line bg-surface font-sans text-ink [box-shadow:0_18px_48px_rgba(26,23,20,0.18)]";

export const PWA_TEXT = "m-0 text-[14px] leading-normal text-ink-light";

export const PWA_ACTIONS = "mt-4 flex justify-end gap-2.5 max-[640px]:*:flex-1";

export default function PwaHead({ titleId, title, children }) {
  return (
    <div className="flex items-start gap-3.5">
      <LogoMark className="size-[46px] flex-[0_0_auto]" />
      <div>
        <h2
          id={titleId}
          className="mx-0 mb-1 mt-0.5 font-serif text-[22px] font-bold leading-[1.15]"
        >
          {title}
        </h2>
        <p className={PWA_TEXT}>{children}</p>
      </div>
    </div>
  );
}
