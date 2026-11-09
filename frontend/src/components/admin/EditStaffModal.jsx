import { useEffect, useState } from "react";
import api from "../../services/api";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import ModalFoot from "./dashboard/ModalFoot";
import ModalHead from "./dashboard/ModalHead";
import Field from "./Field";
import { ERROR, FIELD_HINT, INPUT } from "./styles";
import { formatApiError } from "./utils";

export default function EditStaffModal({
  member,
  departments,
  divisions,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!member) return;
    setForm({
      full_name: member.full_name || "",
      email: member.email || "",
      phone: member.phone || "",
      role: member.role || "Staff",
      department: String(member.department || ""),
      division: String(member.division || ""),
    });
    setError("");
  }, [member]);

  if (!member || !form) return null;

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const departmentDivisions = divisions.filter(
    (d) => String(d.department) === form.department,
  );

  const save = async (e) => {
    e.preventDefault();
    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.department ||
      !form.division
    ) {
      setError("Name, email, department and division are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.patch(`/staff/${member.id}/`, {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: form.role,
        department: Number(form.department),
        division: Number(form.division),
      });
      onSaved?.();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      look="modal"
      className="gp-root"
      onClose={onClose}
      dismissible={!saving}
    >
      <form className="contents" onSubmit={save}>
        <ModalHead
          eyebrow="Edit staff"
          title={member.full_name}
          onClose={onClose}
        />
        <div className="grid grid-cols-2 flex-col gap-x-4 gap-y-3.5 px-7 pt-3.5 pb-1.5 max-[760px]:grid-cols-1">
          <Field label="Full name">
            <input
              className={INPUT}
              value={form.full_name}
              onChange={update("full_name")}
            />
          </Field>
          <Field label="Work email">
            <input
              className={INPUT}
              type="email"
              value={form.email}
              onChange={update("email")}
            />
          </Field>
          <Field
            label={
              <>
                Phone <em className={FIELD_HINT}>optional</em>
              </>
            }
          >
            <input
              className={INPUT}
              type="tel"
              value={form.phone}
              onChange={update("phone")}
              placeholder="+254 700 000 000"
            />
          </Field>
          <Field label="Access">
            <select
              className={INPUT}
              value={form.role}
              onChange={update("role")}
            >
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </Field>
          <Field label="Department">
            <select
              className={INPUT}
              value={form.department}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  department: e.target.value,
                  division: "",
                }))
              }
            >
              <option value="">Choose department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Division">
            <select
              className={INPUT}
              value={form.division}
              onChange={update("division")}
              disabled={!form.department}
            >
              <option value="">
                {departmentDivisions.length
                  ? "Choose division"
                  : "No divisions yet"}
              </option>
              {departmentDivisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          {error && <p className={`${ERROR} col-span-full`}>{error}</p>}
        </div>
        <ModalFoot>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="solid" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </ModalFoot>
      </form>
    </Dialog>
  );
}
