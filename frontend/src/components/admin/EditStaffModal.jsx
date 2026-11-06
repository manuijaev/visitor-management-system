import { useEffect, useState } from 'react';
import api from '../../services/api';
import Icon from './Icon';
import { formatApiError } from './utils';

export default function EditStaffModal({ member, departments, divisions, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!member) return;
    setForm({
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || 'Staff',
      department: String(member.department || ''),
      division: String(member.division || ''),
    });
    setError('');
  }, [member]);

  if (!member || !form) return null;

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const departmentDivisions = divisions.filter((d) => String(d.department) === form.department);

  const save = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.department || !form.division) {
      setError('Name, email, department and division are required.');
      return;
    }
    setSaving(true);
    setError('');
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
    <div className="ad-modal-overlay" onClick={() => !saving && onClose()}>
      <form className="ad-modal" onClick={(e) => e.stopPropagation()} onSubmit={save} role="dialog" aria-modal="true">
        <header className="ad-modal-head">
          <div>
            <div className="ad-eyebrow">Edit staff</div>
            <h2>{member.full_name}</h2>
          </div>
          <button type="button" className="ad-icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </header>
        <div className="ad-modal-body ad-form ad-form-grid">
          <label className="ad-field">
            <span>Full name</span>
            <input value={form.full_name} onChange={update('full_name')} />
          </label>
          <label className="ad-field">
            <span>Work email</span>
            <input type="email" value={form.email} onChange={update('email')} />
          </label>
          <label className="ad-field">
            <span>Phone <em>optional</em></span>
            <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+254 700 000 000" />
          </label>
          <label className="ad-field">
            <span>Access</span>
            <select value={form.role} onChange={update('role')}>
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </label>
          <label className="ad-field">
            <span>Department</span>
            <select value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value, division: '' }))}>
              <option value="">Choose department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          <label className="ad-field">
            <span>Division</span>
            <select value={form.division} onChange={update('division')} disabled={!form.department}>
              <option value="">{departmentDivisions.length ? 'Choose division' : 'No divisions yet'}</option>
              {departmentDivisions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          {error && <p className="ad-error ad-span-2">{error}</p>}
        </div>
        <footer className="ad-modal-foot">
          <button type="button" className="ad-btn ad-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="ad-btn ad-btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
        </footer>
      </form>
    </div>
  );
}
