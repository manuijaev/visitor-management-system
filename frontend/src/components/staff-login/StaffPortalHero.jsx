import AuthHero from "../auth/AuthHero";

const HERO_COPY = {
  invite: {
    badge: "Welcome aboard",
    title: "One step to your dashboard",
    body: "Your administrator has created your account. Set a password and you will go straight to your visitor dashboard.",
  },
  login: {
    badge: "Staff Portal",
    title: "Manage Requests in Real Time",
    body: "Log in to respond quickly, update visitor requests, and communicate with visitors from one central dashboard.",
  },
};

export default function StaffPortalHero({ isInvite }) {
  const copy = isInvite ? HERO_COPY.invite : HERO_COPY.login;
  return (
    <AuthHero image="staff" badge={copy.badge} title={copy.title}>
      {copy.body}
    </AuthHero>
  );
}
