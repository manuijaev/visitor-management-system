const GLYPH =
  "size-[22px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]";

export function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={GLYPH}>
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
      <path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" />
    </svg>
  );
}

export function AddSquareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={GLYPH}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

export function DotsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[22px] fill-current stroke-none"
    >
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}
