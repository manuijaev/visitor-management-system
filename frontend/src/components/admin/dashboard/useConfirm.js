import { useCallback, useState } from "react";

const CLOSED = { isOpen: false };

export default function useConfirm() {
  const [confirmDialog, setConfirmDialog] = useState(CLOSED);

  const openConfirm = useCallback(
    (options) => setConfirmDialog({ isOpen: true, ...options }),
    [],
  );
  const closeConfirm = useCallback(() => setConfirmDialog(CLOSED), []);
  const runConfirm = async () => {
    const { action } = confirmDialog;
    closeConfirm();
    if (action) await action();
  };

  return { confirmDialog, openConfirm, closeConfirm, runConfirm };
}
