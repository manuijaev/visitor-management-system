import useBodyClass from "../components/admin/useBodyClass";
import AdminOnboardingHero from "../components/admin/signup/AdminOnboardingHero";
import AdminSignupPanel from "../components/admin/signup/AdminSignupPanel";
import AdminSignupView from "../components/admin/signup/AdminSignupView";
import { AuthSubtitle } from "../components/auth/AuthHeading";
import AuthLayout from "../components/auth/AuthLayout";
import AuthPanel from "../components/auth/AuthPanel";
import useAdminExists from "../components/admin/signup/useAdminExists";

export default function AdminSignupPage() {
  useBodyClass("auth-background");
  const { adminExists, checking } = useAdminExists();

  if (checking) {
    return (
      <AuthLayout>
        <AuthPanel>
          <AuthSubtitle>Checking system status...</AuthSubtitle>
        </AuthPanel>
      </AuthLayout>
    );
  }

  if (adminExists) {
    return (
      <AuthLayout>
        <AdminOnboardingHero title="Admin Registration Closed">
          An admin account already exists. Please use the staff login page to
          access your account.
        </AdminOnboardingHero>
        <AdminSignupPanel subtitle="Admin registration is disabled because an admin account already exists." />
      </AuthLayout>
    );
  }

  return <AdminSignupView />;
}
