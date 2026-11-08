import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LogoMark from '../components/LogoMark';
import '../home.css';

const TZ = 'Africa/Nairobi';
const TZ_OFFSET = '+03:00';
const OPEN_HOUR = 8;
const CLOSE_HOUR = 17;
const SLOT_MINUTES = 30;
const LEAD_MINUTES = 30;
const BOOKABLE_DAYS = 10;
const RECEPTION_KEY = 'gp_reception_mode';
const RECEPTION_RESET_SECONDS = 20;
const SLIDE_SECONDS = 6;

const STEPS = ['When', 'Teacher', 'Details', 'Review'];

const VISIT_MODES = [
  { id: 'now', icon: 'pin', title: "I'm here now", sub: 'Waiting at reception' },
  { id: 'onway', icon: 'route', title: 'On my way', sub: 'Arriving shortly' },
  { id: 'later', icon: 'calendar', title: 'Plan a visit', sub: 'Pick a day and time' },
];

const ETA_CHOICES = [10, 15, 30, 45, 60];
const PURPOSES = ['Parent–teacher meeting', 'Admissions enquiry', 'Fees / bursar', 'Student pickup', 'Counselling', 'Other'];

const SLIDES = [
  {
    key: 'team',
    eyebrow: 'Walk-ins',
    title: 'At the gate? The teacher knows in seconds.',
    text: 'Choose who you are here to see and we alert them by SMS, email and push.',
    alt: 'Colleagues standing together in an office lobby',
  },
  {
    key: 'meet',
    eyebrow: 'Plan ahead',
    title: 'Meeting a teacher later this week?',
    text: 'Pick a day and a time slot. We text you once the teacher confirms, no internet needed.',
    alt: 'Group of people greeting the sunrise together',
  },
  {
    key: 'host',
    eyebrow: 'Staff',
    title: 'Teachers respond from anywhere.',
    text: 'Accept, reschedule or decline in one tap, and you hear back straight away.',
    alt: 'Professional working late on a laptop with a cup of coffee',
  },
];

const HOW_STEPS = [
  { icon: 'clock', title: 'Choose when', text: "Here now, on your way, or a slot later this week. It's one tap." },
  { icon: 'search', title: 'Pick a teacher or staff member', text: 'Search by name or browse departments. Availability is shown live.' },
  { icon: 'message', title: 'Get a text back', text: 'They are alerted instantly and you get an SMS as soon as they reply.' },
];

const ICON_PATHS = {
  pin: (
    <>
      <path d="M12 21s7-6.1 7-11.5a7 7 0 1 0-14 0C5 14.9 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  route: <path d="M3.5 11.2 20.5 3.5l-7.7 17-1.9-7.4-7.4-1.9z" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  message: <path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  desk: <path d="M3 10.5h18v3H3zM5.5 13.5v6.5M18.5 13.5v6.5M8.5 6.5h7v4h-7z" />,
  download: <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
};

function Icon({ name, className = '' }) {
  return (
    <svg
      className={`gp-icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidPhone = (value) => /^\+?\d{9,15}$/.test((value || '').replace(/[\s()-]/g, ''));

function eatParts(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    weekday: parts.weekday,
  };
}

const isWeekend = (weekday) => weekday === 'Sat' || weekday === 'Sun';
const formatInTz = (value, options, locale = 'en-GB') =>
  new Intl.DateTimeFormat(locale, { timeZone: TZ, ...options }).format(new Date(value));
const formatTime = (value) => formatInTz(value, { hour: 'numeric', minute: '2-digit' }, 'en-US');
const formatDayLong = (value) => formatInTz(value, { weekday: 'long', day: 'numeric', month: 'long' });

function isOfficeOpen(now) {
  const { hour, weekday } = eatParts(now);
  return !isWeekend(weekday) && hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}

function buildSlots(dateKey, now) {
  const earliest = now.getTime() + LEAD_MINUTES * 60 * 1000;
  const slots = [];
  for (let minutes = OPEN_HOUR * 60; minutes < CLOSE_HOUR * 60; minutes += SLOT_MINUTES) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    const value = `${dateKey}T${hh}:${mm}:00${TZ_OFFSET}`;
    slots.push({
      value,
      label: formatTime(value),
      afternoon: minutes >= 12 * 60,
      available: new Date(value).getTime() > earliest,
    });
  }
  return slots;
}

function buildDays(now) {
  const days = [];
  for (let offset = 0; days.length < BOOKABLE_DAYS && offset < 21; offset += 1) {
    const { dateKey, weekday } = eatParts(new Date(now.getTime() + offset * 86400000));
    if (isWeekend(weekday) || !buildSlots(dateKey, now).some((slot) => slot.available)) continue;
    const noon = `${dateKey}T12:00:00${TZ_OFFSET}`;
    days.push({
      key: dateKey,
      label: offset === 0 ? 'Today' : offset === 1 ? 'Tmrw' : weekday,
      date: formatInTz(noon, { day: 'numeric' }),
      month: formatInTz(noon, { month: 'short' }),
    });
  }
  return days;
}

const toStaff = (member) => ({
  id: member.id,
  name: (member.full_name || '').trim() || member.email || 'Staff member',
  departmentId: member.department ?? null,
  departmentName: member.department_name || '',
  divisionId: member.division ?? null,
  divisionName: member.division_name || '',
  available: member.is_available !== false,
  reason: (member.availability_reason || '').trim(),
  unavailableDates: Array.isArray(member.unavailable_dates) ? member.unavailable_dates : [],
});

const firstName = (name) => (name || '').trim().split(/\s+/)[0] || '';
const initials = (name) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
const placement = (host) => [host.departmentName, host.divisionName].filter(Boolean).join(' · ');
const matchesQuery = (host, query) =>
  !query || `${host.name} ${host.departmentName} ${host.divisionName}`.toLowerCase().includes(query);

function hostBlockReason(host, mode, dayKey) {
  if (!host.departmentId || !host.divisionId) return 'Not set up for visits yet';
  if (mode === 'later') {
    const blocked = dayKey && host.unavailableDates.includes(dayKey);
    return blocked ? 'Unavailable on that day' : null;
  }
  if (!host.available) return host.reason || 'Unavailable right now';
  return null;
}

function describeError(error) {
  const detail = error?.response?.data;
  if (detail && typeof detail === 'object') {
    const [field, first] = Object.entries(detail)[0] || [];
    const text = Array.isArray(first) ? first[0] : first;
    if (typeof text === 'string') {
      if (!field || field === 'detail' || field === 'non_field_errors') return text;
      const label = field.replace(/_/g, ' ');
      return `${label.charAt(0).toUpperCase()}${label.slice(1)}: ${text}`;
    }
  }
  if (!error?.response) return "We couldn't reach the server. Check your connection and try again.";
  return 'Something went wrong while sending your request. Please try again.';
}

const icsText = (value) => value.replace(/[\\,;]/g, (match) => `\\${match}`);

function downloadCalendarInvite(visit) {
  const start = new Date(visit.arrival);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gatepass//Visit//EN',
    'BEGIN:VEVENT',
    `UID:${visit.reference}@gatepass`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${icsText(`Visit with ${visit.host.name}`)}`,
    `DESCRIPTION:${icsText(`Gatepass reference ${visit.reference}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `gatepass-${visit.reference}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);
  const count = SLIDES.length;
  const goTo = useCallback((next) => setIndex((next + count) % count), [count]);
  const slide = SLIDES[index];

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const onTouchEnd = (event) => {
    if (touchStart.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(delta) > 40) goTo(index + (delta < 0 ? 1 : -1));
  };

  return (
    <div
      className={`gp-showcase ${paused ? 'is-paused' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0].clientX;
      }}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="How Gatepass works"
    >
      {SLIDES.map((item, i) => (
        <figure key={item.key} className={`gp-slide gp-slide--${item.key} ${i === index ? 'is-active' : ''}`} aria-hidden={i !== index}>
          <img
            src={`/images/carousel/${item.key}-1600.jpg`}
            srcSet={`/images/carousel/${item.key}-800.jpg 800w, /images/carousel/${item.key}-1600.jpg 1600w`}
            sizes="(min-width: 1100px) 56vw, 100vw"
            alt={item.alt}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        </figure>
      ))}
      <div className="gp-showcase-shade" aria-hidden="true" />

      <div className="gp-showcase-top">
        <p className="gp-overline">School visitor desk</p>
        <h1>
          Let the school know <em>you&apos;re here.</em>
        </h1>
      </div>

      <div className="gp-showcase-bottom">
        <div className="gp-caption" key={slide.key} aria-live="polite">
          <span>{slide.eyebrow}</span>
          <strong>{slide.title}</strong>
          <p>{slide.text}</p>
        </div>
        <div className="gp-carousel-controls">
          <button type="button" className="gp-carousel-btn" onClick={() => goTo(index - 1)} aria-label="Previous slide">
            <Icon name="chevronLeft" />
          </button>
          <div className="gp-dots">
            {SLIDES.map((item, i) => (
              <button
                key={item.key}
                type="button"
                className={`gp-dot ${i === index ? 'is-active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Show slide ${i + 1}: ${item.eyebrow}`}
                aria-current={i === index ? 'true' : undefined}
              >
                <span className="gp-dot-bar">
                  {i === index && (
                    <span
                      key={index}
                      className="gp-dot-fill"
                      style={{ animationDuration: `${SLIDE_SECONDS}s` }}
                      onAnimationEnd={() => goTo(index + 1)}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="gp-carousel-btn" onClick={() => goTo(index + 1)} aria-label="Next slide">
            <Icon name="chevronRight" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusTag({ host }) {
  return (
    <span className={`gp-status ${host.available ? '' : 'is-away'}`}>{host.available ? 'Available' : 'Away'}</span>
  );
}

function Field({ label, optional, hint, error, full, children }) {
  return (
    <label className={`gp-field ${full ? 'gp-field--full' : ''}`}>
      <span className="gp-label">
        {label}
        {optional && <small>optional</small>}
      </span>
      {children}
      {(error || hint) && <span className={`gp-hint ${error ? 'is-error' : ''}`}>{error || hint}</span>}
    </label>
  );
}

function ReviewRow({ icon, label, value, sub, onEdit }) {
  return (
    <div className="gp-review-row">
      <span className="gp-review-icon">
        <Icon name={icon} />
      </span>
      <div className="gp-review-text">
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <small>{sub}</small>}
      </div>
      <button type="button" className="gp-review-edit" onClick={onEdit}>
        Edit
      </button>
    </div>
  );
}

const emptyVisitor = { name: '', phone: '', email: '', studentName: '', studentClass: '', purpose: '', message: '' };

export default function HomePage() {
  const [receptionMode, setReceptionMode] = useState(() => localStorage.getItem(RECEPTION_KEY) === '1');
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(() => (localStorage.getItem(RECEPTION_KEY) === '1' ? 'now' : null));
  const [eta, setEta] = useState(15);
  const [dayKey, setDayKey] = useState(null);
  const [slot, setSlot] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [visitor, setVisitor] = useState(emptyVisitor);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [visit, setVisit] = useState(null);
  const [countdown, setCountdown] = useState(RECEPTION_RESET_SECONDS);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hostQuery, setHostQuery] = useState('');
  const [hostDept, setHostDept] = useState('all');
  const [dirQuery, setDirQuery] = useState('');
  const [dirDept, setDirDept] = useState('all');
  const [now, setNow] = useState(() => new Date());
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState('');
  const flowRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    document.body.classList.add('home-background');
    return () => document.body.classList.remove('home-background');
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/staff/'), api.get('/departments/')])
      .then(([staffRes, deptRes]) => {
        if (!active) return;
        setStaff((staffRes.data || []).map(toStaff));
        setDepartments(deptRes.data || []);
      })
      .catch((error) => console.error('Failed to load hosts', error))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  }, []);

  const days = useMemo(() => buildDays(now), [now]);
  const slots = useMemo(() => (dayKey ? buildSlots(dayKey, now) : []), [dayKey, now]);
  const officeOpen = isOfficeOpen(now);
  const host = staff.find((member) => member.id === hostId) || null;
  const hostFirst = host ? firstName(host.name) : '';
  const slotStillOpen = slot && slots.some((item) => item.value === slot && item.available);

  useEffect(() => {
    if (dayKey && !days.some((day) => day.key === dayKey)) {
      setDayKey(null);
      setSlot(null);
    }
  }, [days, dayKey]);

  const nameOk = visitor.name.trim().length >= 2;
  const phoneOk = isValidPhone(visitor.phone);
  const emailOk = !visitor.email.trim() || EMAIL_RE.test(visitor.email.trim());
  const whenOk = mode === 'now' || mode === 'onway' || (mode === 'later' && Boolean(slotStillOpen));
  const blockFor = (member, visitMode = mode) =>
    hostBlockReason(member, visitMode, visitMode === 'later' ? dayKey : null);
  const hostOk = Boolean(host) && !blockFor(host);
  const detailsOk = nameOk && phoneOk && emailOk;
  const stepDone = [whenOk, hostOk, detailsOk, false];
  const canOpenStep = (target) => stepDone.slice(0, target).every(Boolean);

  const scrollFlowIntoView = () => {
    const card = flowRef.current;
    if (card && card.getBoundingClientRect().top < 0) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToStep = (target) => {
    if (target === step || !canOpenStep(target)) return;
    setStep(target);
    scrollFlowIntoView();
  };

  const advanceFromWhen = (visitMode) => {
    const hostReady = host && !blockFor(host, visitMode);
    setStep(hostReady ? 2 : 1);
    scrollFlowIntoView();
  };

  const selectMode = (visitMode) => {
    setMode(visitMode);
    if (visitMode === 'now') advanceFromWhen('now');
    if (visitMode === 'later' && !dayKey) {
      const firstOpen = days.find(
        (day) => !host?.unavailableDates.includes(day.key) && buildSlots(day.key, now).some((item) => item.available)
      );
      if (firstOpen) setDayKey(firstOpen.key);
    }
  };

  const pickHost = (member) => {
    setHostId(member.id);
    if (step === 1) {
      setTimeout(() => {
        setStep(2);
        scrollFlowIntoView();
      }, 180);
    }
  };

  const updateVisitor = (field, value) => setVisitor((prev) => ({ ...prev, [field]: value }));
  const touch = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const goNext = () => {
    if (step === 0 && whenOk) advanceFromWhen(mode);
    else if (step === 1 && hostOk) goToStep(2);
    else if (step === 2) {
      setTouched({ name: true, phone: true, email: true });
      if (detailsOk) goToStep(3);
    }
  };

  const resetFlow = useCallback(() => {
    setStep(0);
    setMode(receptionMode ? 'now' : null);
    setEta(15);
    setDayKey(null);
    setSlot(null);
    setHostId(null);
    setVisitor(emptyVisitor);
    setTouched({});
    setSubmitError('');
    setVisit(null);
    setHostQuery('');
    setHostDept('all');
  }, [receptionMode]);

  useEffect(() => {
    if (!visit || !receptionMode) return undefined;
    setCountdown(RECEPTION_RESET_SECONDS);
    const timer = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          clearInterval(timer);
          resetFlow();
          return RECEPTION_RESET_SECONDS;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [visit, receptionMode, resetFlow]);

  const toggleReception = () => {
    const next = !receptionMode;
    setReceptionMode(next);
    localStorage.setItem(RECEPTION_KEY, next ? '1' : '0');
    if (next && step === 0 && !mode) setMode('now');
    setNavOpen(false);
    showToast(next ? 'Reception mode on: checking in walk-in visitors' : 'Reception mode off');
  };

  const student = [visitor.studentName.trim(), visitor.studentClass.trim() && `(${visitor.studentClass.trim()})`]
    .filter(Boolean)
    .join(' ');
  const note = [visitor.purpose && `Purpose: ${visitor.purpose}`, visitor.message.trim()].filter(Boolean).join(' · ');

  const submit = async () => {
    if (!host || submitting) return;
    const arrival =
      mode === 'now' ? new Date() : mode === 'onway' ? new Date(Date.now() + eta * 60 * 1000) : new Date(slot);
    setSubmitting(true);
    setSubmitError('');
    try {
      const { data } = await api.post('/appointments/create/', {
        visitor_name: visitor.name.trim(),
        visitor_phone: visitor.phone.trim(),
        visitor_email: visitor.email.trim(),
        student_name: visitor.studentName.trim(),
        student_class: visitor.studentClass.trim(),
        department: host.departmentId,
        division: host.divisionId,
        staff_member: host.id,
        appointment_date: arrival.toISOString(),
        message: note,
      });
      const id = data?.data?.id;
      setVisit({
        reference: id ? `GP-${String(id).padStart(5, '0')}` : `GP-${String(Date.now()).slice(-6)}`,
        arrival: arrival.toISOString(),
        mode,
        eta,
        host,
        visitor: { ...visitor },
      });
      scrollFlowIntoView();
    } catch (error) {
      setSubmitError(describeError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToId = (id) => {
    setNavOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visitFromDirectory = (member) => {
    setHostId(member.id);
    setVisit(null);
    if (whenOk && !blockFor(member)) setStep(2);
    else setStep(0);
    scrollToId('check-in');
    showToast(`${firstName(member.name)} selected. ${whenOk ? 'Add your details' : 'Now choose when'}.`);
  };

  const whenLabel = () => {
    if (mode === 'now') return 'Right now · at reception';
    if (mode === 'onway') return `In about ${eta} minutes`;
    if (mode === 'later' && slot) return `${formatDayLong(slot)}, ${formatTime(slot)}`;
    return 'Not chosen yet';
  };

  const hostList = staff
    .filter((member) => hostDept === 'all' || String(member.departmentId) === hostDept)
    .filter((member) => matchesQuery(member, hostQuery.trim().toLowerCase()))
    .sort((a, b) => Number(Boolean(blockFor(a))) - Number(Boolean(blockFor(b))) || a.name.localeCompare(b.name));

  const directory = staff
    .filter((member) => dirDept === 'all' || String(member.departmentId) === dirDept)
    .filter((member) => matchesQuery(member, dirQuery.trim().toLowerCase()))
    .sort((a, b) => Number(b.available) - Number(a.available) || a.name.localeCompare(b.name));

  const departmentChips = (value, onChange) => (
    <div className="gp-chips gp-chips--scroll" role="tablist" aria-label="Filter by department">
      {[{ id: 'all', name: 'All' }, ...departments].map((dept) => (
        <button
          key={dept.id}
          type="button"
          role="tab"
          aria-selected={value === String(dept.id)}
          className={`gp-chip ${value === String(dept.id) ? 'is-on' : ''}`}
          onClick={() => onChange(String(dept.id))}
        >
          {dept.name}
        </button>
      ))}
    </div>
  );

  const titles = receptionMode
    ? ['When is the visit?', 'Who are they here to see?', 'Visitor details', 'Review and send']
    : ['When are you visiting?', 'Who are you here to see?', 'Your details', 'Review and send'];

  const primaryLabel =
    step < 3
      ? 'Continue'
      : mode === 'now'
        ? `Alert ${hostFirst} now`
        : mode === 'onway'
          ? `Let ${hostFirst} know`
          : 'Send visit request';

  const renderWhen = () => (
    <>
      <div className="gp-modes" role="radiogroup" aria-label="Visit type">
        {VISIT_MODES.map((option) => {
          const disabled = option.id !== 'later' && host && !host.available;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={mode === option.id}
              className={`gp-mode ${mode === option.id ? 'is-on' : ''}`}
              disabled={disabled}
              onClick={() => selectMode(option.id)}
            >
              <span className="gp-mode-icon">
                <Icon name={option.icon} />
              </span>
              <span className="gp-mode-text">
                <strong>{option.title}</strong>
                <small>{option.sub}</small>
              </span>
              <span className="gp-mode-check">
                <Icon name="check" />
              </span>
            </button>
          );
        })}
      </div>

      {host && !host.available && (
        <p className="gp-note">
          <Icon name="info" />
          <span>
            {hostFirst} is away right now{host.reason ? `: ${host.reason}` : ''}. You can still plan a visit for later.
          </span>
        </p>
      )}
      {!officeOpen && mode && mode !== 'later' && (
        <p className="gp-note gp-note--warn">
          <Icon name="clock" />
          <span>The school office is closed right now (open weekdays 8 AM to 5 PM). Staff may reply when they are back.</span>
        </p>
      )}

      {mode === 'onway' && (
        <div className="gp-sub">
          <p className="gp-sub-label">Arriving in about</p>
          <div className="gp-chips">
            {ETA_CHOICES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                aria-pressed={eta === minutes}
                className={`gp-chip ${eta === minutes ? 'is-on' : ''}`}
                onClick={() => setEta(minutes)}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'later' && (
        <div className="gp-sub">
          <p className="gp-sub-label">Pick a day</p>
          <div className="gp-days">
            {days.map((day) => (
              <button
                key={day.key}
                type="button"
                aria-pressed={dayKey === day.key}
                disabled={Boolean(host?.unavailableDates.includes(day.key))}
                title={host?.unavailableDates.includes(day.key) ? `${hostFirst} is away this day` : undefined}
                className={`gp-day ${dayKey === day.key ? 'is-on' : ''}`}
                onClick={() => {
                  setDayKey(day.key);
                  setSlot(null);
                }}
              >
                <span>{day.label}</span>
                <strong>{day.date}</strong>
                <small>{day.month}</small>
              </button>
            ))}
          </div>

          {dayKey && (
            <>
              <p className="gp-sub-label gp-sub-label--spaced">
                Pick a time <span>East Africa Time</span>
              </p>
              {[
                ['Morning', false],
                ['Afternoon', true],
              ].map(([label, afternoon]) => (
                <div className="gp-slot-group" key={label}>
                  <span className="gp-slot-group-label">{label}</span>
                  <div className="gp-slots">
                    {slots
                      .filter((item) => item.afternoon === afternoon)
                      .map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          disabled={!item.available}
                          aria-pressed={slot === item.value}
                          className={`gp-slot ${slot === item.value ? 'is-on' : ''}`}
                          onClick={() => setSlot(item.value)}
                        >
                          {item.label}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {slotStillOpen && (
            <p className="gp-picked">
              <Icon name="calendar" />
              {formatDayLong(slot)} at {formatTime(slot)}
            </p>
          )}
        </div>
      )}
    </>
  );

  const renderHost = () => (
    <>
      <div className="gp-search">
        <Icon name="search" />
        <input
          className="gp-input"
          type="search"
          placeholder="Search name or department"
          value={hostQuery}
          onChange={(event) => setHostQuery(event.target.value)}
          aria-label="Search for a teacher or staff member"
        />
      </div>
      {departments.length > 1 && departmentChips(hostDept, setHostDept)}
      <div className="gp-hosts" role="radiogroup" aria-label="Teachers and staff">
        {loading &&
          [0, 1, 2].map((key) => <div key={key} className="gp-skeleton" aria-hidden="true" />)}
        {!loading &&
          hostList.map((member) => {
            const block = blockFor(member);
            return (
              <button
                key={member.id}
                type="button"
                role="radio"
                aria-checked={hostId === member.id}
                disabled={Boolean(block)}
                className={`gp-host ${hostId === member.id ? 'is-on' : ''}`}
                onClick={() => pickHost(member)}
              >
                <span className={`gp-avatar gp-tone-${member.id % 5}`}>{initials(member.name)}</span>
                <span className="gp-host-text">
                  <strong>{member.name}</strong>
                  <small>{placement(member) || 'Staff'}</small>
                  {block ? (
                    <em>{block}</em>
                  ) : (
                    mode === 'later' && !member.available && <em className="is-soft">Away today, but you can book</em>
                  )}
                </span>
                <StatusTag host={member} />
              </button>
            );
          })}
        {!loading && hostList.length === 0 && (
          <div className="gp-empty">
            {staff.length === 0
              ? 'No staff are listed yet. Please ask at the reception desk.'
              : `No one matches "${hostQuery}". Try another name or department.`}
          </div>
        )}
      </div>
    </>
  );

  const renderDetails = () => (
    <div className="gp-fields">
      <Field
        full
        label={receptionMode ? "Visitor's full name" : 'Full name'}
        error={touched.name && !nameOk ? 'Please enter a full name.' : ''}
      >
        <input
          className={`gp-input ${touched.name && !nameOk ? 'is-invalid' : ''}`}
          autoComplete={receptionMode ? 'off' : 'name'}
          placeholder="e.g. Sarah Kiprono"
          value={visitor.name}
          onChange={(event) => updateVisitor('name', event.target.value)}
          onBlur={() => touch('name')}
        />
      </Field>
      <Field
        label="Phone number"
        hint="We text updates here, no internet needed."
        error={touched.phone && !phoneOk ? 'Enter a valid number, e.g. 0712 345 678.' : ''}
      >
        <input
          className={`gp-input ${touched.phone && !phoneOk ? 'is-invalid' : ''}`}
          type="tel"
          inputMode="tel"
          autoComplete={receptionMode ? 'off' : 'tel'}
          placeholder="0712 345 678"
          value={visitor.phone}
          onChange={(event) => updateVisitor('phone', event.target.value)}
          onBlur={() => touch('phone')}
        />
      </Field>
      <Field
        label="Email"
        optional
        hint="Get an email copy of updates."
        error={touched.email && !emailOk ? 'That email address looks incomplete.' : ''}
      >
        <input
          className={`gp-input ${touched.email && !emailOk ? 'is-invalid' : ''}`}
          type="email"
          inputMode="email"
          autoComplete={receptionMode ? 'off' : 'email'}
          placeholder="you@example.com"
          value={visitor.email}
          onChange={(event) => updateVisitor('email', event.target.value)}
          onBlur={() => touch('email')}
        />
      </Field>
      <Field label="Student name" optional hint="If the visit is about a student.">
        <input
          className="gp-input"
          autoComplete="off"
          maxLength={120}
          placeholder="e.g. Brian Otieno"
          value={visitor.studentName}
          onChange={(event) => updateVisitor('studentName', event.target.value)}
        />
      </Field>
      <Field label="Class / grade" optional>
        <input
          className="gp-input"
          autoComplete="off"
          maxLength={40}
          placeholder="e.g. Grade 5 East"
          value={visitor.studentClass}
          onChange={(event) => updateVisitor('studentClass', event.target.value)}
        />
      </Field>
      <div className="gp-field gp-field--full">
        <span className="gp-label">
          Purpose <small>optional</small>
        </span>
        <div className="gp-chips">
          {PURPOSES.map((purpose) => (
            <button
              key={purpose}
              type="button"
              aria-pressed={visitor.purpose === purpose}
              className={`gp-chip ${visitor.purpose === purpose ? 'is-on' : ''}`}
              onClick={() => updateVisitor('purpose', visitor.purpose === purpose ? '' : purpose)}
            >
              {purpose}
            </button>
          ))}
        </div>
      </div>
      <Field full label={`Note for ${hostFirst || 'the teacher'}`} optional>
        <textarea
          className="gp-input"
          rows={3}
          maxLength={300}
          placeholder="Anything they should know before you meet"
          value={visitor.message}
          onChange={(event) => updateVisitor('message', event.target.value)}
        />
      </Field>
    </div>
  );

  const renderReview = () => (
    <>
      <div className="gp-review">
        <ReviewRow icon="clock" label="When" value={whenLabel()} onEdit={() => goToStep(0)} />
        <ReviewRow icon="user" label="Seeing" value={host?.name} sub={host && placement(host)} onEdit={() => goToStep(1)} />
        <ReviewRow
          icon="pin"
          label="Visitor"
          value={visitor.name.trim()}
          sub={[visitor.phone.trim(), visitor.email.trim()].filter(Boolean).join(' · ')}
          onEdit={() => goToStep(2)}
        />
        {student && <ReviewRow icon="user" label="Student" value={student} onEdit={() => goToStep(2)} />}
        {note && <ReviewRow icon="message" label="Note" value={note} onEdit={() => goToStep(2)} />}
      </div>
      <p className="gp-fineprint">
        <Icon name="message" />
        <span>
          {hostFirst} gets an SMS, email and push alert. {receptionMode ? 'The visitor' : 'You'} will get a text at{' '}
          <strong>{visitor.phone.trim()}</strong> when they respond.
        </span>
      </p>
      {submitError && (
        <div className="gp-error" role="alert">
          {submitError}
        </div>
      )}
    </>
  );

  const renderSuccess = () => {
    const visitorFirst = firstName(visit.visitor.name);
    const visitHostFirst = firstName(visit.host.name);
    const headline =
      visit.mode === 'now'
        ? `Take a seat, ${visitorFirst}.`
        : visit.mode === 'onway'
          ? `See you soon, ${visitorFirst}.`
          : `You're booked in, ${visitorFirst}.`;
    const body =
      visit.mode === 'now'
        ? `${visit.host.name} has been alerted that you're at reception.`
        : visit.mode === 'onway'
          ? `${visit.host.name} knows you're arriving in about ${visit.eta} minutes.`
          : `${visit.host.name} will confirm your visit for ${formatDayLong(visit.arrival)} at ${formatTime(visit.arrival)}.`;
    return (
      <div className="gp-pass">
        <span className="gp-pass-check">
          <Icon name="check" />
        </span>
        <p className="gp-eyebrow">{visit.mode === 'later' ? 'Request sent' : 'Host alerted'}</p>
        <h2>{headline}</h2>
        <p className="gp-pass-body">
          {body} We&apos;ll text <strong>{visit.visitor.phone.trim()}</strong> when they respond.
        </p>

        <div className="gp-ticket">
          <dl className="gp-ticket-grid">
            <div>
              <dt>Visitor</dt>
              <dd>{visit.visitor.name.trim()}</dd>
            </div>
            <div>
              <dt>Seeing</dt>
              <dd>{visit.host.name}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>
                {visit.mode === 'later'
                  ? `${formatInTz(visit.arrival, { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(visit.arrival)}`
                  : visit.mode === 'now'
                    ? `Now, ${formatTime(visit.arrival)}`
                    : `Around ${formatTime(visit.arrival)}`}
              </dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>{placement(visit.host) || 'Reception'}</dd>
            </div>
          </dl>
          <div className="gp-ticket-foot">
            <span className="gp-ticket-status">
              <span className="gp-pulse" aria-hidden="true" />
              Waiting for {visitHostFirst}
            </span>
            <span className="gp-ticket-ref">{visit.reference}</span>
          </div>
        </div>

        <div className="gp-pass-actions">
          {visit.mode === 'later' && (
            <button type="button" className="gp-btn gp-btn--ghost" onClick={() => downloadCalendarInvite(visit)}>
              <Icon name="download" />
              Add to calendar
            </button>
          )}
          <button type="button" className="gp-btn gp-btn--dark" onClick={resetFlow}>
            {receptionMode ? 'Next visitor' : 'Done'}
          </button>
        </div>
        {receptionMode && <p className="gp-pass-auto">Starting a new check-in in {countdown}s</p>}
      </div>
    );
  };

  return (
    <div className="gp-root" id="top">
      <header className={`gp-nav ${navOpen ? 'is-open' : ''}`}>
        <div className="gp-nav-inner">
          <a
            href="#top"
            className="gp-brand"
            onClick={(event) => {
              event.preventDefault();
              setNavOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <LogoMark className="gp-brand-mark" />
            <span>
              <strong>Gatepass</strong>
              <small>Visitor desk</small>
            </span>
          </a>
          <nav className="gp-nav-links" aria-label="Sections">
            <button type="button" onClick={() => scrollToId('check-in')}>
              Check in
            </button>
            <button type="button" onClick={() => scrollToId('how')}>
              How it works
            </button>
            <button type="button" onClick={() => scrollToId('directory')}>
              Directory
            </button>
          </nav>
          <div className="gp-nav-actions">
            <button
              type="button"
              role="switch"
              aria-checked={receptionMode}
              className={`gp-switch ${receptionMode ? 'is-on' : ''}`}
              onClick={toggleReception}
            >
              <span className="gp-switch-track" aria-hidden="true" />
              Reception mode
            </button>
            <Link to="/staff/login" className="gp-btn gp-btn--dark gp-btn--sm">
              Staff login
            </Link>
          </div>
          <button
            type="button"
            className="gp-nav-toggle"
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            <Icon name={navOpen ? 'close' : 'menu'} />
          </button>
        </div>
        {navOpen && (
          <div className="gp-nav-panel">
            <button type="button" onClick={() => scrollToId('check-in')}>
              Check in
            </button>
            <button type="button" onClick={() => scrollToId('how')}>
              How it works
            </button>
            <button type="button" onClick={() => scrollToId('directory')}>
              Directory
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={receptionMode}
              className={`gp-switch ${receptionMode ? 'is-on' : ''}`}
              onClick={toggleReception}
            >
              <span className="gp-switch-track" aria-hidden="true" />
              Reception mode
            </button>
            <Link to="/staff/login" className="gp-btn gp-btn--dark" onClick={() => setNavOpen(false)}>
              Staff login
            </Link>
          </div>
        )}
      </header>

      <main>
        <section className="gp-hero">
          <HeroCarousel />

          <section className="gp-flow" id="check-in" ref={flowRef} aria-labelledby="gp-flow-title">
            {receptionMode && (
              <div className="gp-flow-reception">
                <Icon name="desk" />
                <span>Reception mode: checking in a visitor</span>
                <button type="button" onClick={toggleReception}>
                  Turn off
                </button>
              </div>
            )}

            {visit ? (
              renderSuccess()
            ) : (
              <>
                <header className="gp-flow-head">
                  <div>
                    <p className="gp-eyebrow">
                      Step {step + 1} of {STEPS.length}
                    </p>
                    <h2 id="gp-flow-title">{titles[step]}</h2>
                  </div>
                  <span className={`gp-office ${officeOpen ? '' : 'is-closed'}`}>
                    {officeOpen ? 'School open' : 'School closed'}
                  </span>
                </header>

                <ol className="gp-stepper">
                  {STEPS.map((label, i) => (
                    <li
                      key={label}
                      className={`${i === step ? 'is-current' : ''} ${i < step && stepDone[i] ? 'is-done' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => goToStep(i)}
                        disabled={!canOpenStep(i)}
                        aria-current={i === step ? 'step' : undefined}
                      >
                        <span className="gp-stepper-bar" />
                        <span className="gp-stepper-label">
                          {i < step && stepDone[i] && <Icon name="check" />}
                          {label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>

                <div className="gp-flow-body" key={step}>
                  {step === 0 && renderWhen()}
                  {step === 1 && renderHost()}
                  {step === 2 && renderDetails()}
                  {step === 3 && renderReview()}
                </div>

                <footer className="gp-flow-foot">
                  {step > 0 && (
                    <button
                      type="button"
                      className="gp-btn gp-btn--ghost gp-btn--icon"
                      onClick={() => setStep(step - 1)}
                      aria-label="Back"
                    >
                      <Icon name="arrowLeft" />
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      type="button"
                      className="gp-btn gp-btn--dark gp-btn--grow"
                      onClick={goNext}
                      disabled={step === 0 ? !whenOk : step === 1 ? !hostOk : false}
                    >
                      {primaryLabel}
                      <Icon name="arrowRight" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="gp-btn gp-btn--gold gp-btn--grow"
                      onClick={submit}
                      disabled={submitting}
                    >
                      {submitting ? 'Sending…' : primaryLabel}
                      {!submitting && <Icon name="arrowRight" />}
                    </button>
                  )}
                </footer>
              </>
            )}
          </section>
        </section>

        <section className="gp-section" id="how">
          <div className="gp-section-head">
            <p className="gp-overline gp-overline--dark">How it works</p>
            <h2>
              Three taps to <em>the right teacher.</em>
            </h2>
            <p>Built for parents at the gate and meetings planned days ahead, on any phone, tablet or laptop.</p>
          </div>
          <div className="gp-how">
            {HOW_STEPS.map((item, i) => (
              <article className="gp-how-card" key={item.title}>
                <span className="gp-how-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="gp-how-icon">
                  <Icon name={item.icon} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="gp-section gp-section--tinted" id="directory">
          <div className="gp-section-head">
            <p className="gp-overline gp-overline--dark">Directory</p>
            <h2>
              Find the right <em>teacher.</em>
            </h2>
            <p>Browse by department, see who is available, and start a check-in with one tap.</p>
          </div>
          <div className="gp-dir-tools">
            <div className="gp-search">
              <Icon name="search" />
              <input
                className="gp-input"
                type="search"
                placeholder="Search staff by name, department or division"
                value={dirQuery}
                onChange={(event) => setDirQuery(event.target.value)}
                aria-label="Search the staff directory"
              />
            </div>
            {departments.length > 1 && departmentChips(dirDept, setDirDept)}
          </div>
          <div className="gp-dir-grid">
            {loading && [0, 1, 2].map((key) => <div key={key} className="gp-skeleton gp-skeleton--card" aria-hidden="true" />)}
            {!loading &&
              directory.map((member) => (
                <article className="gp-person" key={member.id}>
                  <div className="gp-person-head">
                    <span className={`gp-avatar gp-tone-${member.id % 5}`}>{initials(member.name)}</span>
                    <div className="gp-host-text">
                      <strong>{member.name}</strong>
                      <small>{placement(member) || 'Staff'}</small>
                    </div>
                    <StatusTag host={member} />
                  </div>
                  {!member.available && member.reason && <p className="gp-person-reason">{member.reason}</p>}
                  <button
                    type="button"
                    className="gp-btn gp-btn--ghost gp-btn--sm"
                    onClick={() => visitFromDirectory(member)}
                    disabled={!member.departmentId || !member.divisionId}
                  >
                    Visit {firstName(member.name)}
                    <Icon name="arrowRight" />
                  </button>
                </article>
              ))}
            {!loading && directory.length === 0 && (
              <div className="gp-empty gp-empty--wide">
                {staff.length === 0 ? 'The staff directory is empty for now.' : 'No one matches that search.'}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="gp-footer">
        <div className="gp-footer-inner">
          <div>
            <strong className="gp-footer-brand">Gatepass</strong>
            <span>Visitor management system</span>
          </div>
          <nav aria-label="Footer">
            <Link to="/staff/login">Staff login</Link>
          </nav>
          <span className="gp-footer-copy">© {now.getFullYear()} Gatepass</span>
        </div>
      </footer>

      {toast && (
        <div className="gp-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
