import Button from "../../ui/Button";
import { DialogTitle } from "../../ui/Dialog";
import Icon from "../Icon";
import { EYEBROW, SERIF } from "../styles";

export default function ModalHead({
  eyebrow,
  title,
  onClose,
  closeDisabled = false,
  drawer = false,
}) {
  return (
    <header
      className={`flex items-start justify-between gap-3 px-7 pt-[26px] pb-2 ${drawer ? "max-[760px]:px-5" : ""}`}
    >
      <div>
        <div className={EYEBROW}>{eyebrow}</div>
        <DialogTitle
          className={`mt-0.5 mb-0 ${SERIF} text-[30px] font-bold leading-[1.1] text-ink`}
        >
          {title}
        </DialogTitle>
      </div>
      <Button
        variant="icon"
        onClick={onClose}
        aria-label="Close"
        disabled={closeDisabled}
      >
        <Icon name="x" size={18} />
      </Button>
    </header>
  );
}
