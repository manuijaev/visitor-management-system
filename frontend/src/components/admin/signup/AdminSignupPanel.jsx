import { Link } from "react-router-dom";
import AuthHeading from "../../auth/AuthHeading";
import AuthPanel from "../../auth/AuthPanel";

export default function AdminSignupPanel({ subtitle, children }) {
  return (
    <AuthPanel>
      <AuthHeading
        eyebrow="Gatepass"
        title="Admin Sign Up"
        subtitle={subtitle}
      />
      {children}
      <div className="mt-6 flex items-center justify-between gap-2.5 border-t border-line pt-5 text-[13px] text-ink-light">
        <span>Already have admin credentials?</span>
        <Link
          to="/staff"
          className="border-b border-gold-mid font-semibold text-gold-dark no-underline hover:border-ink hover:text-ink motion-safe:transition-colors motion-safe:duration-150"
        >
          Go to Staff Login
        </Link>
      </div>
    </AuthPanel>
  );
}
