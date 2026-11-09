import AuthForm from "../../auth/AuthForm";
import Button from "../../ui/Button";
import SignupField from "./SignupField";

export default function AdminSignupForm({
  form,
  error,
  submitting,
  onChange,
  onSubmit,
}) {
  return (
    <AuthForm onSubmit={onSubmit} error={error}>
      <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
        <SignupField
          id="admin_full_name"
          label="Full Name"
          name="full_name"
          value={form.full_name}
          onChange={onChange}
          placeholder="Full Name"
          required
        />
        <SignupField
          id="admin_signup_email"
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="Email"
          autoComplete="username"
          required
        />
        <SignupField
          id="admin_signup_password"
          label="Password"
          password
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <SignupField
          id="admin_confirm_password"
          label="Confirm Password"
          password
          name="confirm_password"
          value={form.confirm_password}
          onChange={onChange}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <div className="col-span-full flex flex-col gap-1.5">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Creating account..." : "Create Admin Account"}
          </Button>
        </div>
      </div>
    </AuthForm>
  );
}
