import { useCallback, useState } from "react";
import useConfirm from "./useConfirm";

const CLOSED_WIZARD = { open: false, presetDepartmentId: null };

export default function useDashboardDialogs() {
  const [wizard, setWizard] = useState(CLOSED_WIZARD);
  const [editingMember, setEditingMember] = useState(null);
  const [reassignVisit, setReassignVisit] = useState(null);
  const [inviteLink, setInviteLink] = useState(null);
  const confirm = useConfirm();

  const openWizard = useCallback(
    (presetDepartmentId = null) =>
      setWizard({ open: true, presetDepartmentId }),
    [],
  );
  const closeWizard = useCallback(() => setWizard(CLOSED_WIZARD), []);

  return {
    wizard,
    openWizard,
    closeWizard,
    editingMember,
    setEditingMember,
    reassignVisit,
    setReassignVisit,
    inviteLink,
    setInviteLink,
    ...confirm,
  };
}
