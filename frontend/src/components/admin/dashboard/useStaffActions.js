import api from "../../../services/api";
import { formatApiError } from "../utils";

export default function useStaffActions({
  notify,
  loadData,
  openConfirm,
  onInviteLink,
}) {
  const run = async (request, successMessage, afterSuccess) => {
    try {
      await request();
      notify(successMessage);
      afterSuccess?.();
      await loadData();
    } catch (err) {
      notify(formatApiError(err), "error");
    }
  };

  const sendInvite = async (member) => {
    try {
      const { data } = await api.post(`/staff/${member.id}/send-invite/`);
      if (data.invite.email_sent) {
        notify(`Link emailed to ${member.email}`);
        return;
      }
      onInviteLink({
        member,
        url: data.invite.invite_url,
        hours: data.invite.expires_in_hours,
      });
    } catch (err) {
      notify(formatApiError(err), "error");
    }
  };

  const toggleActive = (member) =>
    run(
      () =>
        api.patch(
          `/staff/${member.id}/${member.is_active ? "deactivate" : "activate"}/`,
        ),
      `${member.full_name} ${member.is_active ? "deactivated" : "activated"}`,
    );

  const confirmRemoveMember = (member) =>
    openConfirm({
      title: `Remove ${member.full_name}?`,
      message: "Their account will be deleted permanently.",
      confirmText: "Remove",
      tone: "danger",
      action: () =>
        run(
          () => api.delete(`/staff/${member.id}/`),
          `${member.full_name} removed`,
        ),
    });

  const confirmDeleteVisit = (visit) =>
    openConfirm({
      title: "Delete visit request?",
      message: `Remove ${visit.visitor_name}'s request permanently?`,
      confirmText: "Delete",
      tone: "danger",
      action: () =>
        run(
          () => api.delete(`/appointments/delete/${visit.id}/`),
          "Visit request deleted",
        ),
    });

  const reassignVisit = (visit, member, afterSuccess) =>
    run(
      () =>
        api.patch(`/appointments/reassign/${visit.id}/`, {
          staff_member: member.id,
        }),
      `Reassigned to ${member.full_name}`,
      afterSuccess,
    );

  return {
    sendInvite,
    toggleActive,
    confirmRemoveMember,
    confirmDeleteVisit,
    reassignVisit,
  };
}
