import Dialog, { DialogTitle } from "./ui/Dialog";

const LOOKS = {
  "modal-card": "card",
  "sd-modal": "sheet",
};

export default function ModalDialog({
  look,
  className,
  onClose,
  dismissible = true,
  children,
  "aria-label": ariaLabel,
  ...rest
}) {
  return (
    <Dialog
      look={look || LOOKS[className] || "bare"}
      className={className === "modal-card" ? undefined : className}
      onClose={onClose}
      dismissible={dismissible}
      {...rest}
    >
      {children}
      {ariaLabel ? (
        <DialogTitle className="sr-only">{ariaLabel}</DialogTitle>
      ) : (
        <DialogTitle hidden />
      )}
    </Dialog>
  );
}
