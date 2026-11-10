import { useState } from "react";
import AuthField from "../auth/AuthField";
import AuthForm from "../auth/AuthForm";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { extractErrorMessage } from "./extractErrorMessage";

export default function SetPasswordForm({
  invite,
  inviteUid,
  inviteToken,
  onSignedIn,
}) {
  const { acceptInvite } = useAuth();
  const [passwords, setPasswords] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (field) => (e) => {
    const { value } = e.target;
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const submitNewPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (passwords.password !== passwords.confirm) {
      setError("The passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await acceptInvite(
        inviteUid,
        inviteToken,
        passwords.password,
      );
      const firstName = user?.full_name?.split(" ")[0] || "there";
      onSignedIn(user, `You're all set, ${firstName}!`, 900);
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          "Could not set your password. Please try again.",
        ),
      );
      setIsSubmitting(false);
    }
  };

  return (
    <AuthForm onSubmit={submitNewPassword} error={error}>
      <input
        type="email"
        name="username"
        value={invite.email}
        autoComplete="username"
        readOnly
        hidden
      />
      <div className="flex flex-col gap-[18px]">
        <AuthField
          id="new_password"
          label="New password"
          password
          placeholder="At least 8 characters"
          value={passwords.password}
          onChange={onChange("password")}
          autoComplete="new-password"
          minLength={8}
          required
          hint="Avoid common words, and don't use only numbers."
        />
        <AuthField
          id="confirm_password"
          label="Confirm password"
          password
          placeholder="Re-enter your password"
          value={passwords.confirm}
          onChange={onChange("confirm")}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <div className="flex flex-col gap-1.5">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Setting up..." : "Confirm & sign in"}
          </Button>
        </div>
      </div>
    </AuthForm>
  );
}
