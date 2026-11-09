import Button from "./ui/Button";
import Dialog, { DialogTitle } from "./ui/Dialog";

const DOT =
  "inline-block w-1.5 text-center motion-safe:animate-[dotBlink_1.2s_infinite]";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  loadingText = "Processing",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  tone = "default",
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <Dialog
      look="card"
      aria-label={title || "Confirmation dialog"}
      aria-labelledby={undefined}
      onClose={onCancel}
      dismissible={!isLoading}
    >
      <DialogTitle asChild>
        <h3 className="m-0 mb-2 font-serif text-[18px] font-bold text-ink">
          {title || "Please Confirm"}
        </h3>
      </DialogTitle>
      <p className="m-0 mb-5 leading-[1.6] text-ink-light">
        {message || "Are you sure you want to continue?"}
      </p>
      <div className="mt-5 flex justify-end gap-2.5">
        <Button
          variant="muted"
          className="flex-1"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          variant={tone === "danger" ? "danger" : "secondary"}
          className="flex-1"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="inline-flex items-center">
              {loadingText}
              <span className="ml-0.5 inline-flex" aria-hidden="true">
                <span className={DOT}>.</span>
                <span className={`${DOT} motion-safe:[animation-delay:0.2s]`}>
                  .
                </span>
                <span className={`${DOT} motion-safe:[animation-delay:0.4s]`}>
                  .
                </span>
              </span>
            </span>
          ) : (
            confirmText
          )}
        </Button>
      </div>
    </Dialog>
  );
}
