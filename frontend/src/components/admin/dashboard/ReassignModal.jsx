import { useState } from "react";
import Button from "../../ui/Button";
import Dialog from "../../ui/Dialog";
import Field from "../Field";
import { FORM, INPUT, LEAD } from "../styles";
import ModalFoot from "./ModalFoot";
import ModalHead from "./ModalHead";
import { reassignCandidates } from "./helpers";

export default function ReassignModal({ visit, staff, onClose, onReassign }) {
  const [staffId, setStaffId] = useState("");
  const candidates = reassignCandidates(staff, visit);

  const submit = () => {
    const member = staff.find((person) => person.id === Number(staffId));
    if (member) void onReassign(visit, member);
  };

  return (
    <Dialog look="modal" className="gp-root" onClose={onClose}>
      <ModalHead
        eyebrow="Reassign visit"
        title={visit.visitor_name}
        onClose={onClose}
      />
      <div className={`${FORM} px-7 pt-3.5 pb-1.5`}>
        <p className={LEAD}>
          Currently with {visit.staff_name || "nobody"}. Choose who should
          handle it instead. They&apos;ll get an alert, the visit goes back to
          pending, and {visit.visitor_name} gets an SMS with the new name.
        </p>
        <Field label="Staff member">
          <select
            className={INPUT}
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
          >
            <option value="">Choose staff</option>
            {candidates.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name} · {member.department_name || "No department"}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <ModalFoot>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="solid" onClick={submit} disabled={!staffId}>
          Reassign
        </Button>
      </ModalFoot>
    </Dialog>
  );
}
