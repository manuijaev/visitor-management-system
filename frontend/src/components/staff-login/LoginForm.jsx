import { useState } from "react";
import AuthField from "../auth/AuthField";
import AuthForm from "../auth/AuthForm";
import AuthHeading from "../auth/AuthHeading";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { extractErrorMessage } from "./extractErrorMessage";

export default function LoginForm({ onSignedIn }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      onSignedIn(user, `Welcome back, ${user?.full_name || "Staff"}!`, 1200);
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid credentials."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AuthHeading
        eyebrow="Gatepass"
        title="Staff Access"
        subtitle="Sign in to manage visitor requests."
      />
      <AuthForm onSubmit={submitLogin} error={error}>
        <div className="flex flex-col gap-[18px]">
          <AuthField
            id="staff_email"
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={onChange}
            autoComplete="username"
            required
          />
          <AuthField
            id="staff_password"
            label="Password"
            password
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={onChange}
            autoComplete="current-password"
            required
          />
          <div className="flex flex-col gap-1.5">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Authenticating..." : "Login"}
            </Button>
          </div>
        </div>
      </AuthForm>
    </>
  );
}
