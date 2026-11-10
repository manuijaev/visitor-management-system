import AddStaffWizard from "../AddStaffWizard";
import EditStaffModal from "../EditStaffModal";
import InviteLinkModal from "./InviteLinkModal";
import ReassignModal from "./ReassignModal";

export default function DashboardDialogs({ dialogs, data, actions, notify }) {
  const { departments, divisions, staff, loadData } = data;
  const closeReassign = () => dialogs.setReassignVisit(null);
  const closeEdit = () => dialogs.setEditingMember(null);

  return (
    <>
      <AddStaffWizard
        open={dialogs.wizard.open}
        presetDepartmentId={dialogs.wizard.presetDepartmentId}
        onClose={dialogs.closeWizard}
        onCreated={loadData}
        departments={departments}
        divisions={divisions}
        staff={staff}
      />
      <EditStaffModal
        member={dialogs.editingMember}
        departments={departments}
        divisions={divisions}
        onClose={closeEdit}
        onSaved={async () => {
          notify("Changes saved");
          closeEdit();
          await loadData();
        }}
      />
      {dialogs.reassignVisit && (
        <ReassignModal
          visit={dialogs.reassignVisit}
          staff={staff}
          onClose={closeReassign}
          onReassign={(visit, member) =>
            actions.reassignVisit(visit, member, closeReassign)
          }
        />
      )}
      {dialogs.inviteLink && (
        <InviteLinkModal
          invite={dialogs.inviteLink}
          onClose={() => dialogs.setInviteLink(null)}
          notify={notify}
        />
      )}
    </>
  );
}
