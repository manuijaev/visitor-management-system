import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import AuthLayout from "../components/auth/AuthLayout";
import AuthPanel from "../components/auth/AuthPanel";
import Toast from "../components/ui/Toast";
import InvitePanel from "../components/staff-login/InvitePanel";
import LoginForm from "../components/staff-login/LoginForm";
import StaffPortalHero from "../components/staff-login/StaffPortalHero";
import { useInviteCheck } from "../components/staff-login/useInviteCheck";

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerDevice } = useNotification();
  const inviteUid = searchParams.get("uid");
  const inviteToken = searchParams.get("token");
  const { isInvite, invite } = useInviteCheck(inviteUid, inviteToken);
  const [toast, setToast] = useState("");

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

  const tryRegisterDevice = async () => {
    try {
      await registerDevice();
    } catch {}
  };

  const navigateByRole = (user) => {
    const role = String(user?.role || "").toLowerCase();
    const target = role === "admin" ? "/admin/dashboard" : "/staff/dashboard";
    navigate(target, { replace: true });
  };

  const handleSignedIn = (user, message, delayMs) => {
    void tryRegisterDevice();
    setToast(message);
    setTimeout(() => navigateByRole(user), delayMs);
  };

  const leaveInvite = () => navigate("/staff", { replace: true });

  return (
    <AuthLayout footer={<Toast>{toast}</Toast>}>
      <StaffPortalHero isInvite={isInvite} />
      <AuthPanel>
        {isInvite ? (
          <InvitePanel
            invite={invite}
            inviteUid={inviteUid}
            inviteToken={inviteToken}
            onLeave={leaveInvite}
            onSignedIn={handleSignedIn}
          />
        ) : (
          <LoginForm onSignedIn={handleSignedIn} />
        )}
      </AuthPanel>
    </AuthLayout>
  );
}
