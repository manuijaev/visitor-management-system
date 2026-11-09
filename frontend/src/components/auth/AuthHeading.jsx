export default function AuthHeading({ eyebrow, title, subtitle }) {
  return (
    <>
      <div className="motion-safe:animate-[heroFade_0.6s_ease_forwards]">
        <div className="mb-3.5 flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.15em] text-gold-dark uppercase before:h-px before:w-7 before:bg-current before:content-['']">
          {eyebrow}
        </div>
        <h1>{title}</h1>
      </div>
      {subtitle && <AuthSubtitle>{subtitle}</AuthSubtitle>}
    </>
  );
}

export function AuthSubtitle({ children }) {
  return (
    <p className="m-0 mb-7 text-[14px] leading-[1.6] text-ink-light">
      {children}
    </p>
  );
}
