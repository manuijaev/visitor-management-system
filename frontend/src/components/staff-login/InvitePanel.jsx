import AuthForm from "../auth/AuthForm";
import AuthHeading, { AuthSubtitle } from "../auth/AuthHeading";
import Button from "../ui/Button";
import SetPasswordForm from "./SetPasswordForm";

export default function InvitePanel({
  invite,
  inviteUid,
  inviteToken,
  onLeave,
  onSignedIn,
}) {
  if (invite.status === "checking") {
    return <AuthSubtitle>Checking your invite link...</AuthSubtitle>;
  }

  if (invite.status === "invalid") {
    return (
      <>
        <AuthHeading
          eyebrow="Gatepass"
          title="Link expired"
          subtitle={invite.message}
        />
        <AuthForm as="div">
          <Button variant="primary" onClick={onLeave}>
            Go to sign in
          </Button>
        </AuthForm>
      </>
    );
  }

  return (
    <>
      <AuthHeading
        eyebrow="Welcome to Gatepass"
        title="Set your password"
        subtitle={
          <>
            Hi {invite.fullName?.split(" ")[0]}, choose a password for{" "}
            <strong>{invite.email}</strong>. You'll be signed in right after.
          </>
        }
      />
      <SetPasswordForm
        invite={invite}
        inviteUid={inviteUid}
        inviteToken={inviteToken}
        onSignedIn={onSignedIn}
      />
    </>
  );
}
