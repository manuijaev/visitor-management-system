import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import PasswordInput from "../components/PasswordInput";

const extractErrorMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail) && data.detail[0])
    return String(data.detail[0]);
  const firstKey = Object.keys(data)[0];
  const firstValue = firstKey ? data[firstKey] : null;
  if (Array.isArray(firstValue) && firstValue[0]) return String(firstValue[0]);
  if (typeof firstValue === "string") return firstValue;
  return fallback;
};

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, acceptInvite } = useAuth();
  const { registerDevice } = useNotification();
  const inviteUid = searchParams.get("uid");
  const inviteToken = searchParams.get("token");
  const isInvite = Boolean(inviteUid && inviteToken);

  const [form, setForm] = useState({ email: "", password: "" });
  const [invite, setInvite] = useState({
    status: isInvite ? "checking" : "none",
    fullName: "",
    email: "",
    message: "",
  });
  const [newPassword, setNewPassword] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.classList.add("auth-background");
    return () => {
      document.body.classList.remove("auth-background");
    };
  }, []);

  useEffect(() => {
    const flash = sessionStorage.getItem("app_toast");
    if (flash) {
      setToast(flash);
      sessionStorage.removeItem("app_toast");
      setTimeout(() => setToast(""), 2500);
    }
  }, []);

  useEffect(() => {
    if (!isInvite) {
      setInvite({ status: "none", fullName: "", email: "", message: "" });
      return;
    }
    let cancelled = false;
    setInvite((prev) => ({ ...prev, status: "checking" }));
    api
      .get("/staff/invite/", { params: { uid: inviteUid, token: inviteToken } })
      .then(({ data }) => {
        if (!cancelled)
          setInvite({
            status: "ready",
            fullName: data.full_name,
            email: data.email,
            message: "",
          });
      })
      .catch((err) => {
        if (!cancelled) {
          setInvite({
            status: "invalid",
            fullName: "",
            email: "",
            message: extractErrorMessage(
              err,
              "This link is invalid or has expired.",
            ),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isInvite, inviteUid, inviteToken]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const navigateByRole = (user) => {
    const role = String(user?.role || "").toLowerCase();
    if (role === "admin") navigate("/admin/dashboard", { replace: true });
    else navigate("/staff/dashboard", { replace: true });
  };

  const tryRegisterDevice = async () => {
    try {
      await registerDevice();
    } catch {}
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      void tryRegisterDevice();
      setToast(`Welcome back, ${user?.full_name || "Staff"}!`);
      setTimeout(() => navigateByRole(user), 1200);
    } catch (err) {
      setError(extractErrorMessage(err, "Invalid credentials."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitNewPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.password !== newPassword.confirm) {
      setError("The passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await acceptInvite(
        inviteUid,
        inviteToken,
        newPassword.password,
      );
      void tryRegisterDevice();
      setToast(`You're all set, ${user?.full_name?.split(" ")[0] || "there"}!`);
      setTimeout(() => navigateByRole(user), 900);
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

  const leaveInvite = () => {
    setError("");
    navigate("/staff", { replace: true });
  };

  const renderInvitePanel = () => {
    if (invite.status === "checking") {
      return <p className="page-subtitle">Checking your invite link...</p>;
    }

    if (invite.status === "invalid") {
      return (
        <>
          <div className="hero">
            <div className="auth-eyebrow">Gatepass</div>
            <h1>Link expired</h1>
          </div>
          <p className="page-subtitle">{invite.message}</p>
          <div className="card">
            <button
              type="button"
              className="login-submit-btn"
              onClick={leaveInvite}
            >
              Go to sign in
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="hero">
          <div className="auth-eyebrow">Welcome to Gatepass</div>
          <h1>Set your password</h1>
        </div>
        <p className="page-subtitle">
          Hi {invite.fullName?.split(" ")[0]}, choose a password for{" "}
          <strong>{invite.email}</strong>. You'll be signed in right after.
        </p>
        <form className="card" onSubmit={submitNewPassword}>
          <input
            type="email"
            name="username"
            value={invite.email}
            autoComplete="username"
            readOnly
            hidden
          />
          <div className="form-grid-single">
            <div className="field-group">
              <label className="field-label" htmlFor="new_password">
                New password
              </label>
              <PasswordInput
                id="new_password"
                placeholder="At least 8 characters"
                value={newPassword.password}
                onChange={(e) =>
                  setNewPassword((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
              <div className="field-hint">
                Avoid common words, and don't use only numbers.
              </div>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="confirm_password">
                Confirm password
              </label>
              <PasswordInput
                id="confirm_password"
                placeholder="Re-enter your password"
                value={newPassword.confirm}
                onChange={(e) =>
                  setNewPassword((prev) => ({
                    ...prev,
                    confirm: e.target.value,
                  }))
                }
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="field-group">
              <button
                type="submit"
                disabled={isSubmitting}
                className="login-submit-btn"
              >
                {isSubmitting ? "Setting up..." : "Confirm & sign in"}
              </button>
            </div>
          </div>
          {error && <p className="error">{error}</p>}
        </form>
      </>
    );
  };

  return (
    <div className="container">
      <div className="auth-shell">
        <div className="auth-wrap">
          <section className="auth-hero staff-portal-hero">
            <span className="auth-badge">
              {isInvite ? "Welcome aboard" : "Staff Portal"}
            </span>
            <h2>
              {isInvite
                ? "One step to your dashboard"
                : "Manage Requests in Real Time"}
            </h2>
            <p>
              {isInvite
                ? "Your administrator has created your account. Set a password and you will go straight to your visitor dashboard."
                : "Log in to respond quickly, update visitor requests, and communicate with visitors from one central dashboard."}
            </p>
          </section>
          <section className="auth-panel">
            {isInvite ? (
              renderInvitePanel()
            ) : (
              <>
                <div className="hero">
                  <div className="auth-eyebrow">Gatepass</div>
                  <h1>Staff Access</h1>
                </div>
                <p className="page-subtitle">
                  Sign in to manage visitor requests.
                </p>
                <form className="card" onSubmit={submitLogin}>
                  <div className="form-grid-single">
                    <div className="field-group">
                      <label className="field-label" htmlFor="staff_email">
                        Email
                      </label>
                      <input
                        id="staff_email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={onChange}
                        autoComplete="username"
                        required
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label" htmlFor="staff_password">
                        Password
                      </label>
                      <PasswordInput
                        id="staff_password"
                        name="password"
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={onChange}
                        autoComplete="current-password"
                        required
                      />
                    </div>
                    <div className="field-group">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="login-submit-btn"
                      >
                        {isSubmitting ? "Authenticating..." : "Login"}
                      </button>
                    </div>
                  </div>
                  {error && <p className="error">{error}</p>}
                </form>
              </>
            )}
          </section>
        </div>
      </div>
      {toast && <div className="toast toast-success">{toast}</div>}
    </div>
  );
}
