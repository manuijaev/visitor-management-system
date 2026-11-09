import ModalDialog from "./ModalDialog";

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
    <ModalDialog
      className="modal-card"
      aria-label={title || "Confirmation dialog"}
      onClose={onCancel}
      dismissible={!isLoading}
    >
      <h3>{title || "Please Confirm"}</h3>
      <p>{message || "Are you sure you want to continue?"}</p>
      <div className="modal-actions">
        <button
          type="button"
          className="btn-muted"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          type="button"
          className={tone === "danger" ? "btn-danger" : ""}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading-label">
              {loadingText}
              <span className="loading-dots" aria-hidden="true">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </span>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </ModalDialog>
  );
}
