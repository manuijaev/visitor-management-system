import { useState } from 'react';
import api from '../../services/api';
import Icon from './Icon';
import { formatApiError } from './utils';

function InlineEdit({ value, onSave, onCancel, placeholder }) {
  const [text, setText] = useState(value);
  const submit = (e) => {
    e.preventDefault();
    if (text.trim() && text.trim() !== value) onSave(text.trim());
    else onCancel();
  };
  return (
    <form className="ad-inline-edit" onSubmit={submit}>
      <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} onKeyDown={(e) => e.key === 'Escape' && onCancel()} />
      <button type="submit" className="ad-icon-btn ad-icon-btn-sm" aria-label="Save"><Icon name="check" size={14} /></button>
      <button type="button" className="ad-icon-btn ad-icon-btn-sm" onClick={onCancel} aria-label="Cancel"><Icon name="x" size={14} /></button>
    </form>
  );
}

export default function DepartmentsBoard({ departments, divisions, staff, onChange, notify, confirm, onAddStaff }) {
  const [newDepartment, setNewDepartment] = useState('');
  const [newDivisionFor, setNewDivisionFor] = useState({});
  const [editing, setEditing] = useState(null);

  const run = async (request, successMessage) => {
    try {
      await request();
      await onChange();
      if (successMessage) notify(successMessage);
      return true;
    } catch (err) {
      notify(formatApiError(err), 'error');
      return false;
    }
  };

  const createDepartment = async (e) => {
    e.preventDefault();
    const name = newDepartment.trim();
    if (!name) return;
    if (await run(() => api.post('/departments/', { name }), `${name} added`)) setNewDepartment('');
  };

  const createDivision = async (e, departmentId) => {
    e.preventDefault();
    const name = (newDivisionFor[departmentId] || '').trim();
    if (!name) return;
    if (await run(() => api.post('/divisions/', { name, department: departmentId }), `${name} division added`)) {
      setNewDivisionFor((prev) => ({ ...prev, [departmentId]: '' }));
    }
  };

  const countStaff = (key, id) => staff.filter((s) => s[key] === id).length;

  return (
    <div className="ad-departments">
      <form className="ad-card ad-new-dept" onSubmit={createDepartment}>
        <Icon name="building" size={18} />
        <input value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} placeholder="New department name, e.g. Finance" aria-label="New department name" />
        <button type="submit" className="ad-btn ad-btn-primary" disabled={!newDepartment.trim()}>
          <Icon name="plus" size={15} />
          Add department
        </button>
      </form>

      {departments.length === 0 && (
        <div className="ad-empty">
          <Icon name="building" size={28} strokeWidth={1.5} />
          <strong>No departments yet</strong>
          <span>Create one above, or add a staff member and create it as part of that flow.</span>
        </div>
      )}

      <div className="ad-dept-grid">
        {departments.map((dept) => {
          const deptDivisions = divisions.filter((d) => d.department === dept.id);
          const headcount = countStaff('department', dept.id);
          return (
            <section key={dept.id} className="ad-card ad-dept-card">
              <header className="ad-dept-head">
                {editing === `dept-${dept.id}` ? (
                  <InlineEdit
                    value={dept.name}
                    onCancel={() => setEditing(null)}
                    onSave={async (name) => {
                      if (await run(() => api.patch(`/departments/${dept.id}/`, { name }), 'Department renamed')) setEditing(null);
                    }}
                  />
                ) : (
                  <>
                    <div className="ad-dept-title">
                      <span className="ad-dept-icon"><Icon name="building" size={16} /></span>
                      <div>
                        <h3>{dept.name}</h3>
                        <span>{headcount} {headcount === 1 ? 'person' : 'people'} · {deptDivisions.length} {deptDivisions.length === 1 ? 'division' : 'divisions'}</span>
                      </div>
                    </div>
                    <div className="ad-row-tools">
                      <button type="button" className="ad-icon-btn ad-icon-btn-sm" onClick={() => setEditing(`dept-${dept.id}`)} aria-label={`Rename ${dept.name}`}>
                        <Icon name="edit" size={14} />
                      </button>
                      <button
                        type="button"
                        className="ad-icon-btn ad-icon-btn-sm danger"
                        aria-label={`Delete ${dept.name}`}
                        onClick={() => confirm({
                          title: `Delete ${dept.name}?`,
                          message: headcount
                            ? `Its ${deptDivisions.length} divisions will be removed and ${headcount} staff will need a new department.`
                            : 'Its divisions will be removed too.',
                          confirmText: 'Delete',
                          tone: 'danger',
                          action: () => run(() => api.delete(`/departments/${dept.id}/`), `${dept.name} deleted`),
                        })}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </>
                )}
              </header>

              <ul className="ad-division-list">
                {deptDivisions.map((div) => (
                  <li key={div.id}>
                    {editing === `div-${div.id}` ? (
                      <InlineEdit
                        value={div.name}
                        onCancel={() => setEditing(null)}
                        onSave={async (name) => {
                          if (await run(() => api.patch(`/divisions/${div.id}/`, { name, department: dept.id }), 'Division renamed')) setEditing(null);
                        }}
                      />
                    ) : (
                      <>
                        <Icon name="folder" size={14} />
                        <span className="ad-division-name">{div.name}</span>
                        <span className="ad-division-count">{countStaff('division', div.id)}</span>
                        <div className="ad-row-tools">
                          <button type="button" className="ad-icon-btn ad-icon-btn-sm" onClick={() => setEditing(`div-${div.id}`)} aria-label={`Rename ${div.name}`}>
                            <Icon name="edit" size={13} />
                          </button>
                          <button
                            type="button"
                            className="ad-icon-btn ad-icon-btn-sm danger"
                            aria-label={`Delete ${div.name}`}
                            onClick={() => confirm({
                              title: `Delete ${div.name}?`,
                              message: 'Staff in this division will need to be moved to another one.',
                              confirmText: 'Delete',
                              tone: 'danger',
                              action: () => run(() => api.delete(`/divisions/${div.id}/`), `${div.name} deleted`),
                            })}
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              <form className="ad-add-division" onSubmit={(e) => createDivision(e, dept.id)}>
                <Icon name="plus" size={14} />
                <input
                  value={newDivisionFor[dept.id] || ''}
                  onChange={(e) => setNewDivisionFor((prev) => ({ ...prev, [dept.id]: e.target.value }))}
                  placeholder="Add a division"
                  aria-label={`Add a division to ${dept.name}`}
                />
              </form>

              <button type="button" className="ad-link-btn" onClick={() => onAddStaff(dept.id)}>
                <Icon name="userPlus" size={14} />
                Add staff to {dept.name}
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
