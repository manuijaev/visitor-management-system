const IMAGES = {
  admin: "bg-[url('/images/office-late-1920.jpg')] bg-center",
  staff: "bg-[url('/images/team-portrait-1600.jpg')] bg-[position:center_30%]",
};

export default function AuthHero({ image, badge, title, children }) {
  return (
    <section
      className={`relative flex min-h-[560px] flex-col justify-end overflow-hidden bg-ink bg-cover p-10 text-white ${IMAGES[image]} before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(26,23,20,0.05)_0%,rgba(26,23,20,0.35)_45%,rgba(26,23,20,0.9)_100%),linear-gradient(90deg,rgba(201,146,42,0.18),transparent_60%)] before:content-[''] after:pointer-events-none after:absolute after:top-10 after:left-10 after:h-[120px] after:w-px after:bg-[linear-gradient(to_bottom,var(--color-gold-mid),transparent)] after:content-[''] max-[900px]:min-h-[260px] max-[900px]:p-7 max-[900px]:after:top-7 max-[900px]:after:left-7 max-[640px]:max-w-full max-[640px]:min-w-0 [&>*]:relative [&>*]:z-[1]`}
    >
      <span className="mb-4 inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.15em] text-gold-mid uppercase before:h-px before:w-7 before:bg-current before:content-['']">
        {badge}
      </span>
      <h2 className="m-0 mb-3 font-serif text-[clamp(2rem,3.4vw,2.6rem)] leading-[1.08] font-bold tracking-[-0.01em] text-white">
        {title}
      </h2>
      <p className="m-0 max-w-[36ch] text-[15px] leading-[1.65] text-[rgba(249,247,244,0.82)]">
        {children}
      </p>
    </section>
  );
}
