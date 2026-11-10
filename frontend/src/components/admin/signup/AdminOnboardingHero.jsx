import AuthHero from "../../auth/AuthHero";

export default function AdminOnboardingHero({ title, children }) {
  return (
    <AuthHero image="admin" badge="Admin Onboarding" title={title}>
      {children}
    </AuthHero>
  );
}
