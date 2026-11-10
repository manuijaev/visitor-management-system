export default function AuthPanel({ children }) {
  return (
    <section className="relative flex flex-col justify-center bg-surface px-11 py-12 [transform:translateY(14px)] max-[900px]:px-6 max-[900px]:py-8 max-[640px]:max-w-full max-[640px]:min-w-0 motion-safe:animate-[authIn_0.6s_ease_forwards] motion-safe:opacity-0">
      {children}
    </section>
  );
}
