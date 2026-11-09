import AdminOnboardingHero from "./AdminOnboardingHero";
import AdminSignupForm from "./AdminSignupForm";
import AdminSignupPanel from "./AdminSignupPanel";
import AuthLayout from "../../auth/AuthLayout";
import Toast from "../../ui/Toast";
import useAdminSignup from "./useAdminSignup";

export default function AdminSignupView() {
  const { form, error, toast, submitting, onChange, submit } = useAdminSignup();
  return (
    <AuthLayout footer={<Toast>{toast}</Toast>}>
      <AdminOnboardingHero title="Create Admin Access">
        Register a new admin account to manage teams, departments, divisions,
        and appointments in production.
      </AdminOnboardingHero>
      <AdminSignupPanel subtitle="Create your admin profile and continue to the admin dashboard.">
        <AdminSignupForm
          form={form}
          error={error}
          submitting={submitting}
          onChange={onChange}
          onSubmit={submit}
        />
      </AdminSignupPanel>
    </AuthLayout>
  );
}
