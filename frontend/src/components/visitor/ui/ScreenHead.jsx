export default function ScreenHead({ title, children }) {
  return (
    <header>
      <h1 className="mx-0 mb-1.5 mt-1 font-['Cormorant_Garamond',serif] text-[32px] font-bold leading-[1.05]">
        {title}
      </h1>
      <p className="m-0 text-[14.5px] text-ink-light">{children}</p>
    </header>
  );
}
