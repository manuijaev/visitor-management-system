import ConfirmModal from "../../ConfirmModal";

export default function DashboardConfirm({ dialog, onConfirm, onCancel }) {
  return (
    <ConfirmModal
      isOpen={dialog.isOpen}
      title={dialog.title || "Please confirm"}
      message={dialog.message || "Are you sure?"}
      confirmText={dialog.confirmText || "Confirm"}
      tone={dialog.tone || "default"}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
