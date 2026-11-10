import Eyebrow from "../ui/Eyebrow";

export const LOOKUP_BODY = "px-(--gp-pad) pb-7 pt-[30px]";

export default function LookupHeading({ eyebrow, title, children }) {
  return (
    <>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mx-0 mb-2 mt-0 font-['Cormorant_Garamond',serif] text-[clamp(1.8rem,4vw,2.3rem)] font-semibold leading-[1.1]">
        {title}
      </h1>
      <p className="mx-0 mb-[22px] mt-0 text-[14.5px] leading-[1.6] text-ink-light">
        {children}
      </p>
    </>
  );
}
