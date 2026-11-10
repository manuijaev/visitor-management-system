import Button from "../../ui/Button";
import Dialog from "../../ui/Dialog";
import Icon from "../Icon";
import CopyField from "../CopyField";
import { FORM, LEAD } from "../styles";
import { firstName } from "../utils";
import ModalFoot from "./ModalFoot";
import ModalHead from "./ModalHead";

export default function InviteLinkModal({ invite, onClose, notify }) {
  const copy = () =>
    void navigator.clipboard
      ?.writeText(invite.url)
      .then(() => notify("Link copied"));

  return (
    <Dialog look="modal" className="gp-root" onClose={onClose}>
      <ModalHead
        eyebrow="Email not delivered"
        title={`Share this link with ${firstName(invite.member.full_name)}`}
        onClose={onClose}
      />
      <div className={`${FORM} px-7 pt-3.5 pb-1.5`}>
        <p className={LEAD}>
          Email isn&apos;t configured, so send this link another way. It lets
          them set a password and expires in {invite.hours} hours.
        </p>
        <CopyField value={invite.url} label="Password link" onCopy={copy}>
          <Icon name="copy" size={14} />
          Copy
        </CopyField>
      </div>
      <ModalFoot>
        <Button variant="solid" onClick={onClose}>
          Done
        </Button>
      </ModalFoot>
    </Dialog>
  );
}
