import ConfirmModal from "../ConfirmModal";
import { confirmMessage } from "./utils";

export default function StatusConfirmModal({ response }) {
  const { pendingUpdate } = response;
  return (
    <ConfirmModal
      isOpen={Boolean(pendingUpdate)}
      title={`Confirm ${pendingUpdate?.status || ""}`}
      message={confirmMessage(pendingUpdate)}
      confirmText="Yes, Update"
      loadingText="Sending"
      tone={pendingUpdate?.status === "Declined" ? "danger" : "default"}
      isLoading={response.isSending}
      onConfirm={response.confirmStatusUpdate}
      onCancel={response.cancelStatusUpdate}
    />
  );
}
