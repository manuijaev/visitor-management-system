// The .vms-logo styles live inline in index.html so the boot splash can draw the logo before the bundle loads.
export default function LogoMark({ animated = false, className = '' }) {
  const classes = ['vms-logo', animated && 'is-animated', className].filter(Boolean).join(' ');
  return (
    <svg className={classes} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect className="vms-logo-tile" width="64" height="64" rx="18" />
      <path className="vms-logo-arch" d="M21 45V29a11 11 0 0 1 22 0v16" pathLength="1" />
      <path className="vms-logo-sill" d="M15 45h34" />
      <circle className="vms-logo-dot" cx="32" cy="36" r="3.6" />
    </svg>
  );
}
