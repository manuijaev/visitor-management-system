export default function AuthLayout({ children, footer }) {
  return (
    <div className="mx-auto w-full max-w-[1140px] overflow-x-hidden px-5 pt-7 pb-[34px] max-[900px]:px-3.5 max-[900px]:pt-5 max-[900px]:pb-7">
      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center py-7 max-[900px]:block max-[900px]:min-h-auto max-[900px]:pt-3 max-[900px]:pb-5">
        <div className="grid w-[min(100%,980px)] grid-cols-[1.05fr_1fr] items-stretch overflow-hidden rounded-3xl border border-line bg-surface [box-shadow:var(--shadow-float)] max-[900px]:grid-cols-1 max-[640px]:max-w-full max-[640px]:min-w-0">
          {children}
        </div>
      </div>
      {footer}
    </div>
  );
}
