import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import Icon from '../components/admin/Icon';
import AddStaffWizard from '../components/admin/AddStaffWizard';
import EditStaffModal from '../components/admin/EditStaffModal';
import DepartmentsBoard from '../components/admin/DepartmentsBoard';
import GateBoard from '../components/admin/GateBoard';
import {
  EAT_TIMEZONE,
  firstName,
  formatApiError,
  formatVisitDate,
  getInitials,
  getRelativeTimeLabel,
  staffStatus,
} from '../components/admin/utils';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'visitors', label: 'Visitors', icon: 'visitors' },
  { id: 'gate', label: 'Gate', icon: 'shield' },
  { id: 'team', label: 'Team', icon: 'team' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
];

const VISIT_STATUSES = ['All', 'Pending', 'Accepted', 'Declined', 'Rescheduled'];
const STATUS_TONE = { Pending: 'gold', Accepted: 'green', Approved: 'green', Declined: 'red', Rejected: 'red', Rescheduled: 'purple' };
const OVERDUE_MS = 30 * 60 * 1000;

const asList = (data) => (Array.isArray(data) ? data : []);

function Pill({ tone = 'muted', children }) {
  return <span className={`ad-pill ad-pill-${tone}`}>{children}</span>;
}

function Avatar({ name, tone = 'gold' }) {
  return <span className={`ad-avatar ad-avatar-${tone}`}>{getInitials(name)}</span>;
}

function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="ad-menu" ref={ref}>
      <button type="button" className="ad-icon-btn ad-icon-btn-sm" onClick={() => setOpen((v) => !v)} aria-label="More actions" aria-expanded={open}>
        <Icon name="more" size={16} />
      </button>
      {open && (
        <div className="ad-menu-list" role="menu">
          {items.filter(Boolean).map((item) => (
            <button
              type="button"
              role="menuitem"
              key={item.label}
              className={item.danger ? 'danger' : ''}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function buildNotifications(appointments) {
  const now = Date.now();
  const items = [];
  appointments.forEach((a) => {
    const created = new Date(a.created_at || a.appointment_date).getTime();
    if (Number.isNaN(created)) return;
    const staffName = a.staff_name || 'Staff';
    const overdue = a.status === 'Pending' && now - created >= OVERDUE_MS;
    items.push({
      id: `request-${a.id}`,
      tone: overdue ? 'red' : 'gold',
      icon: overdue ? 'alert' : 'visitors',
      title: overdue ? `${a.visitor_name} is still waiting on ${staffName}` : `${a.visitor_name} requested a visit with ${staffName}`,
      message: a.message?.trim() || [a.department_name, a.division_name].filter(Boolean).join(' · '),
      timestamp: created,
      urgent: overdue,
    });
    if (a.status !== 'Pending') {
      items.push({
        id: `response-${a.id}-${a.status}`,
        tone: STATUS_TONE[a.status] || 'muted',
        icon: a.status === 'Declined' ? 'x' : 'check',
        title: `${staffName} ${a.status.toLowerCase()} ${a.visitor_name}'s visit`,
        message: a.response_note?.trim() || '',
        timestamp: created,
        urgent: false,
      });
    }
  });
  return items.sort((x, y) => y.timestamp - x.timestamp).slice(0, 40);
}

function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: EAT_TIMEZONE }).format(new Date()));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [view, setView] = useState('overview');
  const [teamTab, setTeamTab] = useState('people');
  const [navOpen, setNavOpen] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [wizard, setWizard] = useState({ open: false, presetDepartmentId: null });
  const [editingMember, setEditingMember] = useState(null);
  const [reassign, setReassign] = useState(null);
  const [reassignTo, setReassignTo] = useState('');
  const [inviteLink, setInviteLink] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [toast, setToast] = useState(null);

  const [peopleSearch, setPeopleSearch] = useState('');
  const [peopleDept, setPeopleDept] = useState('');
  const [visitorSearch, setVisitorSearch] = useState('');
  const [visitorStatus, setVisitorStatus] = useState('All');
  const [notifFilter, setNotifFilter] = useState('all');
  const [readIds, setReadIds] = useState(() => new Set());
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, []);

  const handleAuthError = useCallback(
    (error) => {
      if (error?.response?.status === 401) {
        logout();
        navigate('/staff/login');
        return true;
      }
      return false;
    },
    [logout, navigate]
  );

  const loadData = useCallback(async () => {
    try {
      const [depRes, divRes, staffRes, apptRes] = await Promise.all([
        api.get('/departments/'),
        api.get('/divisions/'),
        api.get('/staff/?include_inactive=1'),
        api.get('/appointments/my/'),
      ]);
      setDepartments(asList(depRes.data));
      setDivisions(asList(divRes.data));
      setStaff(asList(staffRes.data));
      setAppointments(asList(apptRes.data));
      setLoaded(true);
    } catch (error) {
      if (!handleAuthError(error)) notify('Could not refresh data.', 'error');
    }
  }, [handleAuthError, notify]);

  useEffect(() => {
    if (!user) return undefined;
    loadData();
    const id = setInterval(loadData, 15000);
    return () => clearInterval(id);
  }, [user, loadData]);

  useEffect(() => {
    document.body.classList.add('admin-background');
    return () => document.body.classList.remove('admin-background');
  }, []);

  const goTo = (next) => {
    setView(next);
    setNavOpen(false);
  };

  const openWizard = (presetDepartmentId = null) => setWizard({ open: true, presetDepartmentId });
  const closeWizard = useCallback(() => setWizard({ open: false, presetDepartmentId: null }), []);

  const openConfirm = (options) => setConfirmDialog({ isOpen: true, ...options });
  const closeConfirm = () => setConfirmDialog({ isOpen: false });
  const runConfirm = async () => {
    const action = confirmDialog.action;
    closeConfirm();
    if (action) await action();
  };

  const handleLogout = () => {
    sessionStorage.setItem('app_toast', 'Logged out successfully.');
    logout();
    navigate('/staff/login');
  };

  const sendInvite = async (member) => {
    try {
      const { data } = await api.post(`/staff/${member.id}/send-invite/`);
      if (data.invite.email_sent) {
        notify(`Link emailed to ${member.email}`);
      } else {
        setInviteLink({ member, url: data.invite.invite_url, hours: data.invite.expires_in_hours });
      }
    } catch (err) {
      notify(formatApiError(err), 'error');
    }
  };

  const toggleActive = async (member) => {
    try {
      await api.patch(`/staff/${member.id}/${member.is_active ? 'deactivate' : 'activate'}/`);
      notify(`${member.full_name} ${member.is_active ? 'deactivated' : 'activated'}`);
      await loadData();
    } catch (err) {
      notify(formatApiError(err), 'error');
    }
  };

  const deleteMember = async (member) => {
    try {
      await api.delete(`/staff/${member.id}/`);
      notify(`${member.full_name} removed`);
      await loadData();
    } catch (err) {
      notify(formatApiError(err), 'error');
    }
  };

  const submitReassign = async () => {
    if (!reassign || !reassignTo) return;
    try {
      await api.patch(`/appointments/reassign/${reassign.id}/`, { staff_member: Number(reassignTo) });
      notify(`Reassigned to ${staff.find((s) => s.id === Number(reassignTo))?.full_name}`);
      setReassign(null);
      await loadData();
    } catch (err) {
      notify(formatApiError(err), 'error');
    }
  };

  const deleteVisit = async (visit) => {
    try {
      await api.delete(`/appointments/delete/${visit.id}/`);
      notify('Visit request deleted');
      await loadData();
    } catch (err) {
      notify(formatApiError(err), 'error');
    }
  };

  const exportVisits = () => {
    if (!appointments.length) {
      notify('No visit requests to export.', 'error');
      return;
    }
    const rows = [
      ['ID', 'Visitor', 'Visitor email', 'Staff', 'Department', 'Status', 'Visit date'],
      ...appointments.map((a) => [a.id, a.visitor_name, a.visitor_email, a.staff_name, a.department_name, a.status, a.appointment_date]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `visit_requests_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => {
    const pending = appointments.filter((a) => a.status === 'Pending');
    return {
      total: appointments.length,
      pending: pending.length,
      overdue: pending.filter((a) => Date.now() - new Date(a.created_at || a.appointment_date).getTime() >= OVERDUE_MS).length,
      active: staff.filter((s) => s.is_active && !s.invite_pending).length,
      invited: staff.filter((s) => s.is_active && s.invite_pending).length,
    };
  }, [appointments, staff]);

  const notifications = useMemo(
    () => buildNotifications(appointments).filter((n) => !dismissedIds.has(n.id)).map((n) => ({ ...n, unread: !readIds.has(n.id) })),
    [appointments, readIds, dismissedIds]
  );
  const unreadCount = notifications.filter((n) => n.unread).length;
  const visibleNotifications = notifications.filter((n) => (notifFilter === 'unread' ? n.unread : notifFilter === 'urgent' ? n.urgent : true));

  const filteredPeople = staff.filter((s) => {
    if (peopleDept && String(s.department) !== peopleDept) return false;
    if (!peopleSearch) return true;
    const q = peopleSearch.toLowerCase();
    return [s.full_name, s.email, s.department_name, s.division_name].some((v) => v?.toLowerCase().includes(q));
  });

  const filteredVisits = appointments.filter((a) => {
    if (visitorStatus !== 'All' && a.status !== visitorStatus) return false;
    if (!visitorSearch) return true;
    const q = visitorSearch.toLowerCase();
    return [a.visitor_name, a.visitor_email, a.staff_name, a.department_name].some((v) => v?.toLowerCase().includes(q));
  });

  const pageTitle = { overview: 'Overview', visitors: 'Visitors', gate: 'Gate', team: 'Team', notifications: 'Notifications' }[view];

  const renderVisitRow = (a, compact = false) => (
    <div key={a.id} className={`ad-row ${compact ? 'ad-row-compact' : ''}`}>
      <div className="ad-row-main">
        <Avatar name={a.visitor_name} />
        <div className="ad-row-text">
          <strong>{a.visitor_name}</strong>
          <span>{compact ? `with ${a.staff_name || 'Unassigned'}` : a.visitor_email || a.visitor_phone}</span>
        </div>
      </div>
      {!compact && (
        <div className="ad-row-cell">
          <strong>{a.staff_name || 'Unassigned'}</strong>
          <span>{a.department_name}</span>
        </div>
      )}
      <div className="ad-row-cell ad-row-date">
        <strong>{formatVisitDate(a.appointment_date)}</strong>
        <span>Sent {getRelativeTimeLabel(a.created_at || a.appointment_date)}</span>
      </div>
      <Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill>
      {!compact && (
        <div className="ad-row-tools always">
          <button
            type="button"
            className="ad-icon-btn ad-icon-btn-sm"
            title="Reassign"
            aria-label={`Reassign ${a.visitor_name}`}
            onClick={() => {
              setReassign(a);
              setReassignTo(String(a.staff_member || ''));
            }}
          >
            <Icon name="swap" size={14} />
          </button>
          <button
            type="button"
            className="ad-icon-btn ad-icon-btn-sm danger"
            title="Delete"
            aria-label={`Delete visit from ${a.visitor_name}`}
            onClick={() => openConfirm({
              title: 'Delete visit request?',
              message: `Remove ${a.visitor_name}'s request permanently?`,
              confirmText: 'Delete',
              tone: 'danger',
              action: () => deleteVisit(a),
            })}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      )}
    </div>
  );

  const renderPersonRow = (s, compact = false) => {
    const status = staffStatus(s);
    const isSelf = s.id === user?.id;
    return (
      <div key={s.id} className={`ad-row ${compact ? 'ad-row-compact' : ''}`}>
        <div className="ad-row-main">
          <Avatar name={s.full_name} tone={s.role === 'Admin' ? 'ink' : 'gold'} />
          <div className="ad-row-text">
            <strong>{s.full_name}{isSelf && <span className="ad-you">you</span>}</strong>
            <span>{s.email}</span>
          </div>
        </div>
        {!compact && (
          <div className="ad-row-cell">
            <strong>{s.department_name || 'No department'}</strong>
            <span>{s.division_name || 'No division'}</span>
          </div>
        )}
        {!compact && <Pill tone={s.role === 'Admin' ? 'ink' : 'muted'}>{s.role}</Pill>}
        <Pill tone={status.tone}>{status.label}</Pill>
        {!compact && (
          <div className="ad-row-tools always">
            <button type="button" className="ad-icon-btn ad-icon-btn-sm" onClick={() => setEditingMember(s)} aria-label={`Edit ${s.full_name}`} title="Edit">
              <Icon name="edit" size={14} />
            </button>
            {!isSelf && (
              <RowMenu
                items={[
                  s.is_active && {
                    label: s.invite_pending ? 'Resend invite' : 'Send password reset link',
                    icon: 'mail',
                    onClick: () => sendInvite(s),
                  },
                  { label: s.is_active ? 'Deactivate' : 'Activate', icon: s.is_active ? 'x' : 'check', onClick: () => toggleActive(s) },
                  {
                    label: 'Remove',
                    icon: 'trash',
                    danger: true,
                    onClick: () => openConfirm({
                      title: `Remove ${s.full_name}?`,
                      message: 'Their account will be deleted permanently.',
                      confirmText: 'Remove',
                      tone: 'danger',
                      action: () => deleteMember(s),
                    }),
                  },
                ]}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`ad-shell ${navOpen ? 'nav-open' : ''}`}>
        <aside className="ad-sidebar">
          <div className="ad-brand">
            <span className="ad-brand-mark" />
            <div>
              <div className="ad-brand-name">Gatepass</div>
              <div className="ad-brand-sub">Admin console</div>
            </div>
          </div>

          <nav className="ad-nav">
            {NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`ad-nav-item ${view === item.id ? 'active' : ''}`}
                onClick={() => goTo(item.id)}
                aria-current={view === item.id ? 'page' : undefined}
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
                {item.id === 'visitors' && stats.pending > 0 && <span className="ad-nav-count">{stats.pending}</span>}
                {item.id === 'team' && <span className="ad-nav-count muted">{staff.length}</span>}
                {item.id === 'notifications' && unreadCount > 0 && <span className="ad-nav-count">{unreadCount}</span>}
              </button>
            ))}
          </nav>

          <button type="button" className="ad-sidebar-cta" onClick={() => { setNavOpen(false); openWizard(); }}>
            <Icon name="userPlus" size={16} />
            Add staff member
          </button>

          <div className="ad-sidebar-foot">
            <div className="ad-me">
              <span className="ad-avatar ad-avatar-gold">{getInitials(user?.full_name || 'Admin')}</span>
              <div>
                <strong>{user?.full_name || 'Administrator'}</strong>
                <span>{user?.email}</span>
              </div>
            </div>
            <button type="button" className="ad-nav-item ad-logout" onClick={handleLogout}>
              <Icon name="logout" size={17} />
              <span>Log out</span>
            </button>
          </div>
        </aside>
        <div className="ad-backdrop" onClick={() => setNavOpen(false)} />

        <div className="ad-main">
          <header className="ad-topbar">
            <button type="button" className="ad-icon-btn ad-menu-toggle" onClick={() => setNavOpen(true)} aria-label="Open menu">
              <Icon name="menu" size={18} />
            </button>
            <div className="ad-topbar-title">{pageTitle}</div>
            <div className="ad-topbar-actions">
              <button type="button" className="ad-icon-btn ad-bell" onClick={() => goTo('notifications')} aria-label={`Notifications, ${unreadCount} unread`}>
                <Icon name="bell" size={17} />
                {unreadCount > 0 && <span className="ad-bell-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              <button type="button" className="ad-btn ad-btn-primary ad-topbar-cta" onClick={() => openWizard()}>
                <Icon name="plus" size={15} />
                <span>Add staff</span>
              </button>
            </div>
          </header>

          <main className="ad-content">
            {view === 'overview' && (
              <>
                <div className="ad-page-head">
                  <div>
                    <h1>{greeting()}, <em>{firstName(user?.full_name || 'Admin')}</em></h1>
                    <p>{new Date().toLocaleDateString('en-GB', { timeZone: EAT_TIMEZONE, weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>

                {stats.pending > 0 && (
                  <div className="ad-banner">
                    <Icon name="clock" size={18} />
                    <p>
                      <strong>{stats.pending} visit {stats.pending === 1 ? 'request is' : 'requests are'} awaiting a response</strong>
                      {stats.overdue > 0 && ` · ${stats.overdue} waiting longer than 30 minutes`}
                    </p>
                    <button type="button" className="ad-btn ad-btn-ghost" onClick={() => { setVisitorStatus('Pending'); goTo('visitors'); }}>Review</button>
                  </div>
                )}

                <div className="ad-stats">
                  <div className="ad-stat">
                    <span>Visit requests</span>
                    <strong>{stats.total}</strong>
                    <small>All time</small>
                  </div>
                  <div className="ad-stat">
                    <span>Awaiting response</span>
                    <strong className={stats.pending ? 'gold' : ''}>{stats.pending}</strong>
                    <small>{stats.overdue ? `${stats.overdue} overdue` : 'Nothing overdue'}</small>
                  </div>
                  <div className="ad-stat">
                    <span>Active staff</span>
                    <strong>{stats.active}</strong>
                    <small>{stats.invited ? `${stats.invited} invite${stats.invited === 1 ? '' : 's'} pending` : 'Everyone is set up'}</small>
                  </div>
                  <div className="ad-stat">
                    <span>Departments</span>
                    <strong>{departments.length}</strong>
                    <small>{divisions.length} division{divisions.length === 1 ? '' : 's'}</small>
                  </div>
                </div>

                {loaded && staff.filter((s) => s.role === 'Staff').length === 0 && (
                  <div className="ad-card ad-onboard">
                    <div>
                      <h2>Build your team</h2>
                      <p>Add your first staff member. You can create their department and division in the same step, and they'll get an email to set up their account.</p>
                    </div>
                    <button type="button" className="ad-btn ad-btn-primary" onClick={() => openWizard()}>
                      <Icon name="userPlus" size={15} />
                      Add staff member
                    </button>
                  </div>
                )}

                <div className="ad-grid-2">
                  <section className="ad-card">
                    <header className="ad-card-head">
                      <h2>Recent visit requests</h2>
                      <button type="button" className="ad-link-btn" onClick={() => goTo('visitors')}>View all <Icon name="arrowRight" size={14} /></button>
                    </header>
                    <div className="ad-list">
                      {appointments.slice(0, 5).map((a) => renderVisitRow(a, true))}
                      {!appointments.length && <div className="ad-empty-line">No visit requests yet.</div>}
                    </div>
                  </section>
                  <section className="ad-card">
                    <header className="ad-card-head">
                      <h2>Team</h2>
                      <button type="button" className="ad-link-btn" onClick={() => goTo('team')}>Manage <Icon name="arrowRight" size={14} /></button>
                    </header>
                    <div className="ad-list">
                      {[...staff].sort((x, y) => y.id - x.id).slice(0, 5).map((s) => renderPersonRow(s, true))}
                    </div>
                    <button type="button" className="ad-add-row" onClick={() => openWizard()}>
                      <Icon name="plus" size={15} />
                      Add staff member
                    </button>
                  </section>
                </div>
              </>
            )}

            {view === 'visitors' && (
              <>
                <div className="ad-page-head">
                  <div>
                    <h1>Visitors</h1>
                    <p>Every visit request across your organisation.</p>
                  </div>
                  <button type="button" className="ad-btn ad-btn-ghost" onClick={exportVisits}>
                    <Icon name="download" size={15} />
                    Export CSV
                  </button>
                </div>
                <section className="ad-card">
                  <div className="ad-toolbar">
                    <div className="ad-segmented" role="tablist">
                      {VISIT_STATUSES.map((s) => (
                        <button type="button" key={s} role="tab" aria-selected={visitorStatus === s} className={visitorStatus === s ? 'active' : ''} onClick={() => setVisitorStatus(s)}>
                          {s}
                          {s === 'Pending' && stats.pending > 0 && <span>{stats.pending}</span>}
                        </button>
                      ))}
                    </div>
                    <label className="ad-search">
                      <Icon name="search" size={15} />
                      <input value={visitorSearch} onChange={(e) => setVisitorSearch(e.target.value)} placeholder="Search visitors or staff" />
                    </label>
                  </div>
                  <div className="ad-list ad-list-table ad-cols-visits">
                    {filteredVisits.map((a) => renderVisitRow(a))}
                    {!filteredVisits.length && <div className="ad-empty-line">No visit requests match.</div>}
                  </div>
                </section>
              </>
            )}

            {view === 'gate' && <GateBoard appointments={appointments} onChanged={loadData} notify={notify} />}

            {view === 'team' && (
              <>
                <div className="ad-page-head">
                  <div>
                    <h1>Team</h1>
                    <p>{staff.length} {staff.length === 1 ? 'person' : 'people'} across {departments.length} department{departments.length === 1 ? '' : 's'}</p>
                  </div>
                  <div className="ad-segmented ad-segmented-lg" role="tablist">
                    <button type="button" role="tab" aria-selected={teamTab === 'people'} className={teamTab === 'people' ? 'active' : ''} onClick={() => setTeamTab('people')}>
                      <Icon name="team" size={15} /> People
                    </button>
                    <button type="button" role="tab" aria-selected={teamTab === 'departments'} className={teamTab === 'departments' ? 'active' : ''} onClick={() => setTeamTab('departments')}>
                      <Icon name="building" size={15} /> Departments
                    </button>
                  </div>
                </div>

                {teamTab === 'people' ? (
                  <section className="ad-card">
                    <div className="ad-toolbar">
                      <label className="ad-search">
                        <Icon name="search" size={15} />
                        <input value={peopleSearch} onChange={(e) => setPeopleSearch(e.target.value)} placeholder="Search by name, email or department" />
                      </label>
                      <select className="ad-select" value={peopleDept} onChange={(e) => setPeopleDept(e.target.value)} aria-label="Filter by department">
                        <option value="">All departments</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="ad-list ad-list-table ad-cols-people">
                      {filteredPeople.map((s) => renderPersonRow(s))}
                      {!filteredPeople.length && <div className="ad-empty-line">No one matches that search.</div>}
                    </div>
                    <button type="button" className="ad-add-row" onClick={() => openWizard(peopleDept || null)}>
                      <Icon name="plus" size={15} />
                      Add staff member
                    </button>
                  </section>
                ) : (
                  <DepartmentsBoard
                    departments={departments}
                    divisions={divisions}
                    staff={staff}
                    onChange={loadData}
                    notify={notify}
                    confirm={openConfirm}
                    onAddStaff={(deptId) => openWizard(deptId)}
                  />
                )}
              </>
            )}

            {view === 'notifications' && (
              <>
                <div className="ad-page-head">
                  <div>
                    <h1>Notifications</h1>
                    <p>{unreadCount} unread</p>
                  </div>
                  <button type="button" className="ad-btn ad-btn-ghost" onClick={() => setReadIds(new Set(notifications.map((n) => n.id)))} disabled={!unreadCount}>
                    <Icon name="check" size={15} />
                    Mark all read
                  </button>
                </div>
                <section className="ad-card">
                  <div className="ad-toolbar">
                    <div className="ad-segmented" role="tablist">
                      {[
                        { id: 'all', label: 'All', count: notifications.length },
                        { id: 'unread', label: 'Unread', count: unreadCount },
                        { id: 'urgent', label: 'Urgent', count: notifications.filter((n) => n.urgent).length },
                      ].map((tab) => (
                        <button type="button" key={tab.id} role="tab" aria-selected={notifFilter === tab.id} className={notifFilter === tab.id ? 'active' : ''} onClick={() => setNotifFilter(tab.id)}>
                          {tab.label}
                          {tab.count > 0 && <span>{tab.count}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="ad-list">
                    {visibleNotifications.map((n) => (
                      <div key={n.id} className={`ad-notif ${n.unread ? 'unread' : ''}`}>
                        <span className={`ad-notif-icon ad-pill-${n.tone}`}><Icon name={n.icon} size={15} /></span>
                        <button
                          type="button"
                          className="ad-notif-body"
                          onClick={() => {
                            setReadIds((prev) => new Set(prev).add(n.id));
                            goTo('visitors');
                          }}
                        >
                          <strong>{n.title}</strong>
                          {n.message && <span>{n.message}</span>}
                          <small>{getRelativeTimeLabel(n.timestamp)}</small>
                        </button>
                        <button type="button" className="ad-icon-btn ad-icon-btn-sm" aria-label="Dismiss" onClick={() => setDismissedIds((prev) => new Set(prev).add(n.id))}>
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                    ))}
                    {!visibleNotifications.length && <div className="ad-empty-line">You're all caught up.</div>}
                  </div>
                </section>
              </>
            )}
          </main>
        </div>

        {toast && <div className={`toast-admin ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>{toast.msg}</div>}

        <AddStaffWizard
          open={wizard.open}
          presetDepartmentId={wizard.presetDepartmentId}
          onClose={closeWizard}
          onCreated={loadData}
          departments={departments}
          divisions={divisions}
          staff={staff}
        />

        <EditStaffModal
          member={editingMember}
          departments={departments}
          divisions={divisions}
          onClose={() => setEditingMember(null)}
          onSaved={async () => {
            notify('Changes saved');
            setEditingMember(null);
            await loadData();
          }}
        />

        {reassign && (
          <div className="ad-modal-overlay" onClick={() => setReassign(null)}>
            <div className="ad-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <header className="ad-modal-head">
                <div>
                  <div className="ad-eyebrow">Reassign visit</div>
                  <h2>{reassign.visitor_name}</h2>
                </div>
                <button type="button" className="ad-icon-btn" onClick={() => setReassign(null)} aria-label="Close"><Icon name="x" size={18} /></button>
              </header>
              <div className="ad-modal-body ad-form">
                <p className="ad-lead">Currently with {reassign.staff_name || 'nobody'}. Choose who should handle it instead.</p>
                <label className="ad-field">
                  <span>Staff member</span>
                  <select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                    <option value="">Choose staff</option>
                    {staff.filter((s) => s.is_active).map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name} · {s.department_name || 'No department'}</option>
                    ))}
                  </select>
                </label>
              </div>
              <footer className="ad-modal-foot">
                <button type="button" className="ad-btn ad-btn-ghost" onClick={() => setReassign(null)}>Cancel</button>
                <button type="button" className="ad-btn ad-btn-primary" onClick={submitReassign} disabled={!reassignTo}>Reassign</button>
              </footer>
            </div>
          </div>
        )}

        {inviteLink && (
          <div className="ad-modal-overlay" onClick={() => setInviteLink(null)}>
            <div className="ad-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <header className="ad-modal-head">
                <div>
                  <div className="ad-eyebrow">Email not delivered</div>
                  <h2>Share this link with {firstName(inviteLink.member.full_name)}</h2>
                </div>
                <button type="button" className="ad-icon-btn" onClick={() => setInviteLink(null)} aria-label="Close"><Icon name="x" size={18} /></button>
              </header>
              <div className="ad-modal-body ad-form">
                <p className="ad-lead">Email isn't configured, so send this link another way. It lets them set a password and expires in {inviteLink.hours} hours.</p>
                <div className="ad-copy-field">
                  <input readOnly value={inviteLink.url} onFocus={(e) => e.target.select()} aria-label="Password link" />
                  <button
                    type="button"
                    className="ad-btn ad-btn-ghost"
                    onClick={() => navigator.clipboard?.writeText(inviteLink.url).then(() => notify('Link copied'))}
                  >
                    <Icon name="copy" size={14} />
                    Copy
                  </button>
                </div>
              </div>
              <footer className="ad-modal-foot">
                <button type="button" className="ad-btn ad-btn-primary" onClick={() => setInviteLink(null)}>Done</button>
              </footer>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title || 'Please confirm'}
        message={confirmDialog.message || 'Are you sure?'}
        confirmText={confirmDialog.confirmText || 'Confirm'}
        tone={confirmDialog.tone || 'default'}
        onConfirm={runConfirm}
        onCancel={closeConfirm}
      />
    </>
  );
}
