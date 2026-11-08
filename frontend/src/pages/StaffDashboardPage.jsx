import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import { useNotification } from '../context/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import DaysOffPanel from '../components/DaysOffPanel';
import NotificationsMenu from '../components/NotificationsMenu';
import ViewToggle from '../components/ViewToggle';
import { sendVisitorResponseEmail } from '../services/emailjs';
import api from '../services/api';
import { eatDateKey, formatClockTime, formatTopbarDateTime, matchesVisitFilter, orderVisitsForReview, VISIT_FILTERS } from '../components/admin/utils';

const studentLabel = (visit) =>
  [visit?.student_name?.trim(), visit?.student_class?.trim() && `(${visit.student_class.trim()})`].filter(Boolean).join(' ');

const pad2 = (value) => String(value).padStart(2, '0');
const toLocalInputValue = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

/** Returns an error message for a proposed reschedule time, or '' when it is usable. */
function rescheduleTimeError(value, appointment) {
  if (!value) return 'Pick a new date and time.';
  const proposed = new Date(value);
  if (Number.isNaN(proposed.getTime())) return 'Pick a new date and time.';
  if (proposed.getTime() <= Date.now()) return 'The new time must be in the future.';
  if (appointment && proposed.getTime() === new Date(appointment.appointment_date).getTime()) {
    return 'Pick a time different from the original one.';
  }
  return '';
}

const formatRescheduleTime = (value) =>
  new Date(value).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

/** Screen names shown in the phone top bar. */
const TAB_TITLES = {
  dashboard: 'Home',
  appointments: 'Requests',
  schedule: 'Schedule',
  settings: 'Settings',
};

const REQUEST_FILTERS = VISIT_FILTERS;

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  ),
  alertCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23,4 23,10 17,10" />
      <polyline points="1,20 1,14 7,14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
};

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { appointments, loadMyAppointments, updateAppointment, deleteAppointment, deleteAppointmentsBulk } = useAppointments();
  const { subscribeToForegroundMessages } = useNotification();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [responseNote, setResponseNote] = useState({});
  const [responseAreaOpen, setResponseAreaOpen] = useState({});
  const [rescheduleTo, setRescheduleTo] = useState({});
  const [responseAction, setResponseAction] = useState({});
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [toast, setToast] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewItem, setPreviewItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [isCurrentlyAvailable, setIsCurrentlyAvailable] = useState(user?.is_available ?? true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [overdueDismissedKey, setOverdueDismissedKey] = useState('');
  // Initialize notifications from localStorage for persistence
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('staff_notifications');
      const list = saved ? JSON.parse(saved) : [];
      // Older versions also saved pop-up messages ("Refreshed!"); keep only visit alerts.
      return Array.isArray(list) ? list.filter((item) => item && item.type === 'appointment') : [];
    } catch {
      return [];
    }
  });

  // Current time for clock display
  const [currentTime, setCurrentTime] = useState(new Date());

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('staff_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  }, [notifications]);

  // Subscribe to foreground push notifications
  useEffect(() => {
    let unsubscribe = null;

    const setupSubscription = async () => {
      unsubscribe = await subscribeToForegroundMessages((payload) => {
        // Handle incoming push notification
        const { notification, data } = payload;
        const title = notification?.title || 'Visitor waiting';
        const body = notification?.body || 'You have a visitor waiting for you';

        // Create notification object
        const newNotification = {
          id: Date.now(),
          message: body,
          type: 'appointment',
          read: false,
          timestamp: new Date().toISOString(),
          data: data
        };

        // Add to notifications list
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));

        // Show toast notification
        setToast(body);
        setTimeout(() => setToast(''), 5000);
      });
    };

    if (subscribeToForegroundMessages) {
      setupSubscription();
    }

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [subscribeToForegroundMessages]);

  const profileRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [requestFilter, setRequestFilter] = useState('all');

  const openRequests = (filter = 'all') => {
    setRequestFilter(filter);
    setActiveTab('appointments');
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (!profileOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileOpen]);

  const today = eatDateKey();

  useEffect(() => {
    document.body.classList.remove('home-background', 'auth-background', 'dashboard-background');
    document.body.classList.add('home-background');
    return () => {
      document.body.classList.remove('home-background');
    };
  }, []);

  useEffect(() => {
    loadMyAppointments().catch(() => {
      setError('Session expired. Please log in again.');
    });
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadMyAppointments().catch(() => {});
    }, 15000);
    return () => clearInterval(intervalId);
  }, [loadMyAppointments]);

// Update the clock every 15 seconds; it shows minutes only.
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timerId);
  }, []);


  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return formatClockTime(date);
  };

  const getRelativeTimeLabel = (timestamp) => {
    if (!timestamp) return 'just now';
    const createdTime = new Date(timestamp).getTime();
    if (Number.isNaN(createdTime)) return 'just now';
    const diffSeconds = Math.max(Math.round((Date.now() - createdTime) / 1000), 0);
    if (diffSeconds < 10) return 'just now';
    const units = [
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ];

    for (const unit of units) {
      if (diffSeconds >= unit.seconds) {
        const value = Math.floor(diffSeconds / unit.seconds);
        return `${value} ${unit.label}${value > 1 ? 's' : ''} ago`;
      }
    }

    return `${diffSeconds} second${diffSeconds === 1 ? '' : 's'} ago`;
  };

  const filteredAppointments = orderVisitsForReview(appointments.filter(a => {
    if (!matchesVisitFilter(a, requestFilter)) return false;

    if (dateFilter === 'today' && eatDateKey(a.appointment_date) !== today) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        a.visitor_name?.toLowerCase().includes(query) ||
        a.visitor_email?.toLowerCase().includes(query) ||
        studentLabel(a).toLowerCase().includes(query) ||
        a.service?.name?.toLowerCase().includes(query)
      );
    }
    return true;
  }));

  const stats = {
    pending: appointments.filter(a => a.status === 'Pending').length,
    accepted: appointments.filter(a => a.status === 'Accepted').length,
    declined: appointments.filter(a => a.status === 'Declined').length,
    rescheduled: appointments.filter(a => a.status === 'Rescheduled').length,
    today: appointments.filter(a => eatDateKey(a.appointment_date) === today).length,
    total: appointments.length,
    upcoming: appointments.filter(a => ['Accepted', 'Rescheduled'].includes(a.status) && new Date(a.appointment_date) > new Date()).length,
  };

  /** Confirmed visits still to come, soonest first. */
  const upcomingVisits = appointments
    .filter(a => ['Accepted', 'Rescheduled'].includes(a.status) && new Date(a.appointment_date) > new Date())
    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
    .slice(0, 3);

  const overdueAppointments = appointments
    .filter(a => a.status === 'Pending')
    .filter((a) => {
      const created = new Date(a.created_at || a.appointment_date);
      const createdMs = created.getTime();
      if (Number.isNaN(createdMs)) return false;
      return Date.now() - createdMs >= 30 * 60 * 1000;
    })
    .sort((a, b) => {
      const aTime = new Date(a.created_at || a.appointment_date).getTime();
      const bTime = new Date(b.created_at || b.appointment_date).getTime();
      return aTime - bTime;
    });

  const overdueListKey = overdueAppointments.map((apt) => apt.id).join(',');
  const showOverdueAnnouncement = overdueAppointments.length > 0 && overdueListKey && overdueListKey !== overdueDismissedKey;
  const handleOverdueAnnouncementClick = () => {
    if (!overdueAppointments.length) return;
    openPreview(overdueAppointments[0]);
    setOverdueDismissedKey(overdueListKey);
  };
  const handleOverdueAnnouncementKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOverdueAnnouncementClick();
    }
  };

  const updateStatus = async (appointmentId, status) => {
    const appointment = appointments.find((item) => item.id === appointmentId);
  const fallbackName = appointment?.visitor_name || 'Visitor';
  const note = (responseNote[appointmentId] || '').trim() || `${fallbackName} status set to ${status}.`;
    const newTime = status === 'Rescheduled' ? new Date(rescheduleTo[appointmentId]).toISOString() : null;

    await updateAppointment(appointmentId, {
      status,
      response_note: note,
      ...(newTime ? { appointment_date: newTime } : {}),
    });

    if (appointment && !appointment.visitor_email) {
      setNotice('Status updated. The visitor has no email, so they were notified by SMS.');
      setToast(status === 'Accepted' ? "Visitor notified — they've been paged" : `Response submitted to ${appointment.visitor_name}.`);
    } else if (appointment) {
      const emailResult = await sendVisitorResponseEmail({
        visitor_name: appointment.visitor_name,
        visitor_email: appointment.visitor_email,
        status,
        response_note: note,
        appointment_date: newTime || appointment.appointment_date,
        staff_name: appointment.staff_name || 'Staff',
        staff_email: appointment.staff_email || '',
      });
      const toastMessage =
        status === 'Accepted'
          ? "Visitor notified — they've been paged"
          : `Response submitted to ${appointment.visitor_name}.`;
      if (!emailResult?.sent) {
        setNotice(`Status updated, but email was not sent: ${emailResult?.error || 'EmailJS error'}`);
        setToast(toastMessage);
      } else {
        setNotice('Status updated and visitor email sent.');
        setToast(toastMessage);
      }
    }
  };

  const requestStatusUpdate = (appointmentId, visitorName, status) => {
    const newTime = status === 'Rescheduled' ? rescheduleTo[appointmentId] : null;
    if (status === 'Rescheduled') {
      const appointment = appointments.find((item) => item.id === appointmentId);
      const problem = rescheduleTimeError(newTime, appointment);
      if (problem) {
        setError(problem);
        return false;
      }
    }
    setError('');
    setPendingStatusUpdate({ appointmentId, visitorName, status, newTime });
    return true;
  };

  const handlePreviewResponse = (status) => {
    if (!previewItem) return;
    setResponseAction((prev) => ({ ...prev, [previewItem.id]: status }));
    if (requestStatusUpdate(previewItem.id, previewItem.visitor_name, status)) closePreview();
  };

  const confirmStatusUpdate = async () => {
    if (!pendingStatusUpdate) return;
    const { appointmentId, status } = pendingStatusUpdate;
    setError('');
    setNotice('');
    setIsSendingResponse(true);
    try {
      await updateStatus(appointmentId, status);
      closeResponseArea(appointmentId);
      setResponseNote((prev) => ({ ...prev, [appointmentId]: '' }));
      setTimeout(() => {
        setPendingStatusUpdate(null);
      }, 220);
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      const message =
        err?.response?.data?.response_note?.[0] ||
        err?.response?.data?.appointment_date?.[0] ||
        err?.response?.data?.detail ||
        'Unable to update appointment or send email.';
      setError(message);
      setPendingStatusUpdate(null);
    } finally {
      setIsSendingResponse(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'single') {
      await deleteAppointment(pendingDelete.ids[0]);
    } else {
      await deleteAppointmentsBulk(pendingDelete.ids);
    }
    setSelectedIds([]);
    setSelectionMode(false);
    setPendingDelete(null);
    setPreviewItem(null);
    setNotice('Appointment(s) deleted successfully.');
  };

  const handleLogout = () => {
    sessionStorage.setItem('app_toast', `Goodbye, ${user?.full_name || 'Staff'}! You have been logged out successfully.`);
    logout();
    navigate('/staff');
  };

  const openResponseArea = (id, action = 'Accepted') => {
    setResponseAction((prev) => ({ ...prev, [id]: action }));
    setResponseAreaOpen((prev) => ({ ...prev, [id]: true }));
  };

  const closeResponseArea = (id) => {
    setResponseAreaOpen((prev) => ({ ...prev, [id]: false }));
  };

  const openPreview = (item) => {
    setPreviewItem(item);
  };

  const closePreview = () => {
    setPreviewItem(null);
  };

  /** A short pop-up message. Only visit alerts go into the notifications list. */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleAvailabilityToggle = async () => {
    if (availabilityLoading) return;
    const nextState = !isCurrentlyAvailable;
    setAvailabilityLoading(true);
    try {
      const { data } = await api.patch('/staff/me/availability/', { is_available: nextState });
      const updatedUser = data?.user || {};
      updateUser(updatedUser);
      setIsCurrentlyAvailable(updatedUser.is_available ?? nextState);
      showToast(
        nextState
          ? 'You are now available for visitors.'
          : 'Visitors will see you as unavailable until you toggle back.'
      );
    } catch (err) {
      showToast(
        err?.response?.data?.detail ||
        'Failed to update availability. Try again in a moment.'
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleExportCSV = () => {
    const data = filteredAppointments.length > 0 ? filteredAppointments : appointments;
    if (data.length === 0) {
      showToast('No visit requests to export');
      return;
    }

    const headers = ['ID', 'Visitor Name', 'Visitor Email', 'Student', 'Date/Time Sent', 'Date/Time', 'Status', 'Visitor Message', 'Staff Response'];
    const csvContent = [
      headers.join(','),
      ...data.map(apt => [
        apt.id,
        `"${apt.visitor_name}"`,
        `"${apt.visitor_email}"`,
        `"${studentLabel(apt)}"`,
        `"${apt.appointment_date ? new Date(apt.appointment_date).toLocaleString('en-GB') : ''}"`,
        apt.date && apt.time ? `"${apt.date} ${apt.time}"` : '""',
        apt.status,
        `"${apt.message || ''}"`,
        `"${apt.response_note || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `visit_requests_${eatDateKey()}.csv`;
    link.click();
    showToast('Visit requests exported to CSV');
  };

  const getOverdueHours = (dateStr) => {
    const apptDate = new Date(dateStr);
    const now = new Date();
    const diffMs = now - apptDate;
    return Math.floor(diffMs / (1000 * 60 * 60));
  };

  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))
    .slice(0, 3);

  return (
    <div className="sd-container">
      {/* Toast Notification */}
      {toast && (
        <div className="sd-toast">
          <span>{toast}</span>
          <button onClick={() => setToast('')}>{ICONS.x}</button>
        </div>
      )}

      {/* Sidebar */}
      {sidebarOpen && <div className="sd-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true"></div>}
      <aside className={`sd-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sd-sidebar-header">
          <div className="sd-brand">
            <div className="sd-brand-icon">{ICONS.calendar}</div>
            <div>
              <div className="sd-brand-name">Gatepass</div>
              <div className="sd-brand-role">Staff Portal</div>
            </div>
          </div>
        </div>

        <nav className="sd-nav">
          <div className="sd-nav-section">MAIN</div>
          <button className={`sd-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}>
            {ICONS.dashboard}<span>Home</span>
          </button>
          <button className={`sd-nav-item ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => openRequests(stats.pending > 0 ? 'pending' : 'all')}>
            {ICONS.calendar}<span>Requests</span>
            {stats.pending > 0 && <span className="sd-nav-badge">{stats.pending}</span>}
          </button>
          <button className={`sd-nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => { setActiveTab('schedule'); setSidebarOpen(false); }}>
            {ICONS.clock}<span>Schedule</span>
          </button>

          <div className="sd-nav-section">MORE</div>
          <button className="sd-nav-item" onClick={() => { handleExportCSV(); setSidebarOpen(false); }}>
            {ICONS.download}<span>Export requests</span>
          </button>
          <button className={`sd-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}>
            {ICONS.settings}<span>Settings</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="sd-main">
        {/* Top Bar */}
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <button className="sd-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {ICONS.menu}
            </button>
            <span className="sd-topbar-title">{TAB_TITLES[activeTab] || 'Dashboard'}</span>
            <div className="sd-search-box">
              {ICONS.search}
              <input
                type="text"
                placeholder="Search visitor requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="sd-topbar-right">
            <div className="sd-date-display">
              {formatTopbarDateTime(currentTime)}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isCurrentlyAvailable}
              className={`sd-availability-toggle ${isCurrentlyAvailable ? 'online' : 'offline'}`}
              onClick={handleAvailabilityToggle}
              disabled={availabilityLoading}
              title={isCurrentlyAvailable ? 'Tap to mark yourself away' : 'Tap to mark yourself available'}
            >
              <span className="sd-switch" aria-hidden="true">
                <span className="sd-switch-knob" />
              </span>
              <span className="sd-availability-text">
                {isCurrentlyAvailable ? 'Available' : 'Away'}
              </span>
            </button>
            <NotificationsMenu
              items={notifications.map((n) => ({
                id: n.id,
                text: n.message,
                time: n.time || formatClockTime(n.timestamp),
                unread: !n.read,
              }))}
              onOpenItem={(item) => setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))}
              onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
              action={{ label: 'Clear all', onClick: () => setNotifications([]) }}
            />
            <button className="sd-icon-btn" onClick={() => loadMyAppointments().then(() => showToast('Refreshed!'))}>{ICONS.refresh}</button>
            <div className="sd-profile" ref={profileRef}>
              <button
                type="button"
                className="sd-avatar"
                onClick={() => setProfileOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label={`Account: ${user?.full_name || 'Staff member'}`}
              >
                {getInitials(user?.full_name)}
              </button>
              {profileOpen && (
                <div className="sd-profile-menu" role="menu">
                  <div className="sd-profile-head">
                    <span className="sd-profile-avatar">{getInitials(user?.full_name)}</span>
                    <span>
                      <strong>{user?.full_name || 'Staff member'}</strong>
                      <small>
                        {user?.department_name || 'No department'}
                        {user?.division_name && ` / ${user.division_name}`}
                      </small>
                      {user?.email && <small>{user.email}</small>}
                    </span>
                  </div>
                  <button type="button" role="menuitem" className="sd-profile-item" onClick={() => { setProfileOpen(false); setActiveTab('settings'); }}>
                    Settings
                  </button>
                  <button type="button" role="menuitem" className="sd-profile-item is-danger" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {showOverdueAnnouncement && activeTab === 'dashboard' && (
          <div
            className="sd-overdue-announcement"
            role="button"
            tabIndex={0}
            onClick={handleOverdueAnnouncementClick}
            onKeyDown={handleOverdueAnnouncementKeyDown}
          >
            <div>
              <p className="sd-overdue-announcement-title">⚠️ {overdueAppointments.length} {overdueAppointments.length === 1 ? 'request needs' : 'requests need'} a reply</p>
              <p className="sd-overdue-announcement-detail">
                {overdueAppointments.length === 1 ? `${overdueAppointments[0]?.visitor_name || 'A visitor'} is waiting for your reply.` : `${overdueAppointments[0]?.visitor_name || 'A visitor'} has waited longest.`} Tap to reply.
              </p>
            </div>
            <div className="sd-overdue-meta">
              <span>Asked {getRelativeTimeLabel(overdueAppointments[0]?.created_at || overdueAppointments[0]?.appointment_date)}</span>
              <span className="sd-overdue-cta">Open now →</span>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="sd-content">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="sd-stats-grid">
                <div className="sd-stat-card">
                  <div className="sd-stat-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold-dark)' }}>
                    {ICONS.clock}
                  </div>
                  <div className="sd-stat-info">
                    <div className="sd-stat-value">{stats.pending}</div>
                    <div className="sd-stat-label">Pending</div>
                  </div>
                </div>
                <div className="sd-stat-card">
                  <div className="sd-stat-icon" style={{ background: 'var(--green-light)', color: 'var(--green-dark)' }}>
                    {ICONS.check}
                  </div>
                  <div className="sd-stat-info">
                    <div className="sd-stat-value">{stats.accepted}</div>
                    <div className="sd-stat-label">Accepted</div>
                  </div>
                </div>
                <div className="sd-stat-card">
                  <div className="sd-stat-icon" style={{ background: 'var(--surface2)', color: 'var(--ink)' }}>
                    {ICONS.calendar}
                  </div>
                  <div className="sd-stat-info">
                    <div className="sd-stat-value">{stats.today}</div>
                    <div className="sd-stat-label">Today</div>
                  </div>
                </div>
                <div className="sd-stat-card">
                  <div className="sd-stat-icon" style={{ background: 'var(--gold-light)', color: 'var(--gold-dark)' }}>
                    {ICONS.check}
                  </div>
                  <div className="sd-stat-info">
                    <div className="sd-stat-value">{stats.upcoming}</div>
                    <div className="sd-stat-label">Coming up</div>
                  </div>
                </div>
              </div>

              {/* Up next: confirmed visits still to come */}
              <div className="sd-section">
                <div className="sd-panel">
                  <div className="sd-panel-header">
                    <h3>{ICONS.calendar} Up next</h3>
                    {stats.pending > 0 && (
                      <button type="button" className="sd-link-btn" onClick={() => openRequests('pending')}>
                        {stats.pending} waiting for your reply →
                      </button>
                    )}
                  </div>
                  <div className="sd-list">
                    {upcomingVisits.length === 0 ? (
                      <div className="sd-empty">No confirmed visits coming up.</div>
                    ) : (
                      upcomingVisits.map((apt) => (
                        <div key={apt.id} className="sd-list-item" onClick={() => openPreview(apt)}>
                          <div className="sd-list-avatar" style={{ background: 'var(--green-light)', color: 'var(--green-dark)' }}>
                            {getInitials(apt.visitor_name)}
                          </div>
                          <div className="sd-list-info">
                            <div className="sd-list-name">{apt.visitor_name}</div>
                            <div className="sd-list-meta">
                              {formatDate(apt.appointment_date)} · {formatTime(apt.appointment_date)}
                              {studentLabel(apt) && <span className="sd-list-sub">Student: {studentLabel(apt)}</span>}
                            </div>
                          </div>
                          <span className={`sd-badge sd-badge-${apt.status?.toLowerCase()}`}>{apt.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="sd-section">
                <div className="sd-panel">
                  <div className="sd-panel-header">
                    <h3>{ICONS.activity} Recent Activity</h3>
                  </div>
                  <div className="sd-list">
                    {recentAppointments.length === 0 ? (
                      <div className="sd-empty">No recent visitor requests</div>
                    ) : (
                      recentAppointments.map(apt => (
                        <div key={apt.id} className="sd-list-item" onClick={() => openPreview(apt)}>
                          <div className="sd-list-avatar" style={{
                            background: apt.status === 'Pending' ? 'var(--gold-light)' :
                                       apt.status === 'Accepted' ? 'var(--green-light)' : 'var(--red-light)',
                            color: apt.status === 'Pending' ? 'var(--gold-dark)' :
                                   apt.status === 'Accepted' ? 'var(--green-dark)' : 'var(--red-dark)'
                          }}>
                            {getInitials(apt.visitor_name)}
                          </div>
                          <div className="sd-list-info">
                            <div className="sd-list-name">{apt.visitor_name}</div>
                            <div className="sd-list-meta">
                              {formatDate(apt.appointment_date)} - {formatTime(apt.appointment_date)}
                              <span className="sd-list-time-since">Sent {getRelativeTimeLabel(apt.created_at)}</span>
                            </div>
                          </div>
                          <span className={`sd-badge sd-badge-${apt.status?.toLowerCase()}`}>{apt.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'appointments' && (
            <>
              {/* Filter Bar */}
              <div className="sd-filter-bar">
                <div className="sd-mobile-search">
                  {ICONS.search}
                  <input
                    type="search"
                    placeholder="Search visitor or student"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search visitor requests"
                  />
                </div>
                <div className="sd-filter-tabs" role="tablist" aria-label="Request status">
                  {REQUEST_FILTERS.map((filter) => {
                    const count = filter.statuses ? appointments.filter((a) => filter.statuses.includes(a.status)).length : appointments.length;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        role="tab"
                        aria-selected={requestFilter === filter.id}
                        className={`sd-filter-tab ${requestFilter === filter.id ? 'active' : ''}`}
                        onClick={() => setRequestFilter(filter.id)}
                      >
                        {filter.label}
                        <span className="sd-filter-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
                <label className="sd-today-toggle">
                  <input
                    type="checkbox"
                    checked={dateFilter === 'today'}
                    onChange={(e) => setDateFilter(e.target.checked ? 'today' : 'all')}
                  />
                  <span>Today only</span>
                </label>
                <div className="sd-filter-actions">
                  <ViewToggle value={viewMode} onChange={setViewMode} />
                  <button className="sd-export-btn" onClick={handleExportCSV}>
                    {ICONS.download} Export
                  </button>
                </div>
              </div>

              {/* Appointments Grid/List */}
              <div className="sd-appointments-container">
                {filteredAppointments.length === 0 ? (
                  <div className="sd-empty-state">
                    {ICONS.calendar}
                    <h3>No visit requests found</h3>
                    <p>There are no visit requests matching your criteria.</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="sd-appointments-grid">
                    {filteredAppointments.map(apt => {
                      const overdueHours = apt.status === 'Pending' ? getOverdueHours(apt.appointment_date) : 0;
                      const isUrgent = overdueHours > 24;

                      return (
                        <div key={apt.id} className={`sd-appt-card ${isUrgent ? 'urgent' : ''}`}>
                          <div className="sd-appt-header">
                            <div className="sd-appt-avatar" style={{
                              background: isUrgent ? 'var(--red-light)' : apt.status === 'Accepted' ? 'var(--green-light)' : apt.status === 'Declined' ? 'var(--red-light)' : 'var(--gold-light)',
                              color: isUrgent ? 'var(--red-dark)' : apt.status === 'Accepted' ? 'var(--green-dark)' : apt.status === 'Declined' ? 'var(--red-dark)' : 'var(--gold-dark)'
                            }}>
                              {getInitials(apt.visitor_name)}
                            </div>
                            <div className="sd-appt-status-stack">
                              <span className={`sd-badge sd-badge-${apt.status?.toLowerCase()}`}>{apt.status}</span>
                              <div className="sd-appt-since">
                                <span className="sd-appt-since-icon">{ICONS.clock}</span>
                                <span>Sent {getRelativeTimeLabel(apt.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="sd-appt-body">
                            <h4 className="sd-appt-name">{apt.visitor_name}</h4>
                            <p className="sd-appt-email">{apt.visitor_email || apt.visitor_phone}</p>

                            <div className="sd-appt-details">
                              <div className="sd-appt-detail">
                                {ICONS.calendar}
                                <span>{formatDate(apt.appointment_date)}</span>
                              </div>
                              <div className="sd-appt-detail">
                                {ICONS.clock}
                                <span>{formatTime(apt.appointment_date)}</span>
                              </div>
                              {studentLabel(apt) && (
                                <div className="sd-appt-detail">
                                  {ICONS.user}
                                  <span>Student: {studentLabel(apt)}</span>
                                </div>
                              )}
                              {apt.service?.name && (
                                <div className="sd-appt-detail">
                                  {ICONS.activity}
                                  <span>{apt.service.name}</span>
                                </div>
                              )}
                            </div>

                            {apt.message && (
                              <p className="sd-appt-message">"{apt.message}"</p>
                            )}
                          </div>

                          {apt.status === 'Pending' ? (
                            <div className="sd-appt-actions">
                              <button className="sd-btn sd-btn-accept" onClick={() => openResponseArea(apt.id, 'Accepted')}>Accept</button>
                              <button className="sd-btn sd-btn-reschedule" onClick={() => openResponseArea(apt.id, 'Rescheduled')}>Reschedule</button>
                              <button className="sd-btn sd-btn-decline" onClick={() => openResponseArea(apt.id, 'Declined')}>Decline</button>
                            </div>
                          ) : (
                            <div className="sd-appt-actions">
                              <button className="sd-btn sd-btn-view" onClick={() => openPreview(apt)}>View Details</button>
                            </div>
                          )}

                          {apt.status === 'Pending' && responseAreaOpen[apt.id] && (
                            <div className="sd-response-area">
                              {responseAction[apt.id] === 'Rescheduled' && (
                                <label className="sd-reschedule-field">
                                  <span>New date &amp; time</span>
                                  <input
                                    type="datetime-local"
                                    min={toLocalInputValue(new Date())}
                                    value={rescheduleTo[apt.id] || ''}
                                    onChange={(e) => setRescheduleTo((prev) => ({ ...prev, [apt.id]: e.target.value }))}
                                  />
                                </label>
                              )}
                              <textarea
                                placeholder="Add a response note (optional)..."
                                value={responseNote[apt.id] || ''}
                                onChange={(e) => setResponseNote(prev => ({ ...prev, [apt.id]: e.target.value }))}
                                rows="2"
                              />
                              <div className="sd-response-actions">
                                <button
                                  className="sd-btn sd-btn-accept"
                                  disabled={responseAction[apt.id] === 'Rescheduled' && Boolean(rescheduleTimeError(rescheduleTo[apt.id], apt))}
                                  onClick={() => {
                                    requestStatusUpdate(apt.id, apt.visitor_name, responseAction[apt.id] || 'Accepted');
                                  }}
                                >
                                  Send & {responseAction[apt.id] || 'Accept'}
                                </button>
                                <button className="sd-btn sd-btn-view" onClick={() => closeResponseArea(apt.id)}>Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="sd-appointments-list-view">
                    <div className="sd-list-toolbar">
                      <span className="sd-list-count">{filteredAppointments.length} requests</span>
                    </div>
                    <div className="sd-appointments-list">
                      {filteredAppointments.map((apt) => {
                        const sentTimestamp = apt.created_at || apt.appointment_date;
                        const sentLabel = getRelativeTimeLabel(sentTimestamp);
                        const sentTitle = sentTimestamp ? new Date(sentTimestamp).toLocaleString('en-GB') : '';
                        const statusKey = (apt.status || 'pending').toLowerCase();
                        return (
                          <button
                            type="button"
                            key={apt.id}
                            className="sd-appointments-list-card"
                            onClick={() => openPreview(apt)}
                          >
                            <div className="sd-appointments-list-main">
                              <span className="sd-appointments-list-name">{apt.visitor_name}</span>
                              <span className={`sd-list-simple-status sd-list-simple-status-${statusKey}`}>{apt.status}</span>
                            </div>
                            {apt.appointment_date && (
                              <div className="sd-appointments-list-when">
                                {ICONS.calendar}
                                <span>{formatDate(apt.appointment_date)} · {formatTime(apt.appointment_date)}</span>
                              </div>
                            )}
                            <div className="sd-appointments-list-meta">
                              {studentLabel(apt) ? `Student: ${studentLabel(apt)}` : apt.department_name || 'General visit'}
                            </div>
                            <div className="sd-appointments-list-time" title={sentTitle}>
                              Sent {sentLabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'schedule' && (
            <div className="sd-schedule-view">
              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3>{ICONS.calendar} Today's Schedule</h3>
                </div>
                <div className="sd-timeline">
                  {appointments.filter(a => eatDateKey(a.appointment_date) === today).length === 0 ? (
                    <div className="sd-empty">No visit requests scheduled for today</div>
                  ) : (
                    appointments
                      .filter(a => eatDateKey(a.appointment_date) === today)
                      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
                      .map(apt => (
                        <div key={apt.id} className="sd-timeline-item">
                          <div className="sd-timeline-time">{formatTime(apt.appointment_date)}</div>
                          <div className="sd-timeline-dot"></div>
                          <div className="sd-timeline-content">
                            <div className="sd-timeline-name">{apt.visitor_name}</div>
                            <div className="sd-timeline-meta">{apt.service?.name || 'Appointment'}</div>
                            <div className="sd-timeline-since">Sent {getRelativeTimeLabel(apt.created_at)}</div>
                          </div>
                          <span className={`sd-badge sd-badge-${apt.status?.toLowerCase()}`}>{apt.status}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
              <DaysOffPanel icon={ICONS.calendar} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="sd-settings-view">
              <div className="sd-panel">
                <div className="sd-panel-header">
                  <h3>{ICONS.settings} Settings</h3>
                </div>
                <div className="sd-settings-content">
                  <div className="sd-account-head">
                    <span className="sd-profile-avatar sd-account-avatar">{getInitials(user?.full_name)}</span>
                    <div>
                      <strong>{user?.full_name || 'Staff member'}</strong>
                      <span>{user?.email}</span>
                    </div>
                  </div>
                  <dl className="sd-account-list">
                    <div>
                      <dt>Department</dt>
                      <dd>{user?.department_name || 'Not assigned'}</dd>
                    </div>
                    <div>
                      <dt>Division</dt>
                      <dd>{user?.division_name || 'Not assigned'}</dd>
                    </div>
                    <div>
                      <dt>Visitor requests</dt>
                      <dd>Refresh automatically every 15 seconds</dd>
                    </div>
                  </dl>
                  <p className="sd-account-note">To change your name, email or department, ask the school admin.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <nav className="app-tabbar" aria-label="Main">
        {[
          { id: 'dashboard', label: 'Home', icon: ICONS.dashboard },
          { id: 'appointments', label: 'Requests', icon: ICONS.calendar, badge: stats.pending },
          { id: 'schedule', label: 'Schedule', icon: ICONS.clock },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`app-tab ${activeTab === tab.id ? 'is-active' : ''}`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            onClick={() => (tab.id === 'appointments' ? openRequests(stats.pending > 0 ? 'pending' : 'all') : (setActiveTab(tab.id), setSidebarOpen(false)))}
          >
            <span className="app-tab-icon">
              {tab.icon}
              {tab.badge > 0 && <span className="app-tab-badge">{tab.badge}</span>}
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
        <button type="button" className={`app-tab ${sidebarOpen ? 'is-active' : ''}`} onClick={() => setSidebarOpen(true)}>
          <span className="app-tab-icon">{ICONS.menu}</span>
          <span>More</span>
        </button>
      </nav>

      {/* Preview Modal */}
      {previewItem && (
        <div className="sd-modal-overlay" onClick={closePreview}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h3>Appointment Details</h3>
              <button onClick={closePreview}>{ICONS.x}</button>
            </div>
            <div className="sd-modal-body">
              <div className="sd-modal-avatar" style={{
                background: previewItem.status === 'Pending' ? 'var(--gold-light)' :
                           previewItem.status === 'Accepted' ? 'var(--green-light)' : 'var(--red-light)',
                color: previewItem.status === 'Pending' ? 'var(--gold-dark)' :
                       previewItem.status === 'Accepted' ? 'var(--green-dark)' : 'var(--red-dark)'
              }}>
                {getInitials(previewItem.visitor_name)}
              </div>
              <h4>{previewItem.visitor_name}</h4>
              <p className="sd-modal-email">{previewItem.visitor_email || previewItem.visitor_phone}</p>

              <div className="sd-modal-details">
                <div className="sd-modal-detail">
                  <span>Date</span>
                  <strong>{formatDate(previewItem.appointment_date)}</strong>
                </div>
                <div className="sd-modal-detail">
                  <span>Time</span>
                  <strong>{formatTime(previewItem.appointment_date)}</strong>
                </div>
                {studentLabel(previewItem) && (
                  <div className="sd-modal-detail">
                    <span>Student</span>
                    <strong>{studentLabel(previewItem)}</strong>
                  </div>
                )}
                <div className="sd-modal-detail">
                  <span>Status</span>
                  <span className={`sd-badge sd-badge-${previewItem.status?.toLowerCase()}`}>{previewItem.status}</span>
                </div>
              </div>

              {previewItem.message && (
                <div className="sd-modal-section">
                  <h5>Visitor Message</h5>
                  <p>{previewItem.message}</p>
                </div>
              )}

              {previewItem.response_note && (
                <div className="sd-modal-section">
                  <h5>Staff Response</h5>
                  <p>{previewItem.response_note}</p>
                </div>
              )}

              {previewItem.status === 'Pending' && (
                <div className="sd-modal-section">
                  <h5>New date &amp; time (to reschedule)</h5>
                  <input
                    type="datetime-local"
                    className="sd-modal-response-input"
                    min={toLocalInputValue(new Date())}
                    value={rescheduleTo[previewItem.id] || ''}
                    onChange={(e) => setRescheduleTo((prev) => ({ ...prev, [previewItem.id]: e.target.value }))}
                  />
                </div>
              )}

              {previewItem.status === 'Pending' && (
                <div className="sd-modal-section">
                  <h5>Response note (optional)</h5>
                  <textarea
                    className="sd-modal-response-input"
                    placeholder="Add a brief response note (optional)..."
                    value={responseNote[previewItem.id] || ''}
                    onChange={(e) => setResponseNote((prev) => ({ ...prev, [previewItem.id]: e.target.value }))}
                    rows="3"
                  />
                </div>
              )}
            </div>
            <div className="sd-modal-footer">
              <button type="button" className="sd-btn sd-btn-view" onClick={closePreview}>Close</button>
              {previewItem.status === 'Pending' && (
                <>
                  <button className="sd-btn sd-btn-accept" onClick={() => handlePreviewResponse('Accepted')}>Accept</button>
                  <button
                    className="sd-btn sd-btn-reschedule"
                    disabled={Boolean(rescheduleTimeError(rescheduleTo[previewItem.id], previewItem))}
                    title={rescheduleTimeError(rescheduleTo[previewItem.id], previewItem) || undefined}
                    onClick={() => handlePreviewResponse('Rescheduled')}
                  >
                    Reschedule
                  </button>
                  <button className="sd-btn sd-btn-decline" onClick={() => handlePreviewResponse('Declined')}>Decline</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(pendingStatusUpdate)}
        title={`Confirm ${pendingStatusUpdate?.status || ''}`}
        message={
          pendingStatusUpdate
            ? pendingStatusUpdate.newTime
              ? `Move ${pendingStatusUpdate.visitorName}'s visit to ${formatRescheduleTime(pendingStatusUpdate.newTime)}? They will be notified by SMS.`
              : `Update ${pendingStatusUpdate.visitorName}'s visit request to "${pendingStatusUpdate.status}"?`
            : ''
        }
        confirmText="Yes, Update"
        loadingText="Sending"
        tone={pendingStatusUpdate?.status === 'Declined' ? 'danger' : 'default'}
        isLoading={isSendingResponse}
        onConfirm={confirmStatusUpdate}
        onCancel={() => {
          if (isSendingResponse) return;
          setPendingStatusUpdate(null);
        }}
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        title="Delete visit request(s)?"
        message={
          pendingDelete?.type === 'single'
            ? 'Delete this visit request?'
            : `Delete ${pendingDelete?.ids?.length || 0} selected visit requests?`
        }
        confirmText="Delete"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
