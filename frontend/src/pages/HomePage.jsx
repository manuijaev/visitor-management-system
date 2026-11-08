import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Icon from '../components/visitor/Icon';
import AppShell from '../components/visitor/AppShell';
import {
  isReceptionMode,
  loadVisitorDetails,
  saveVisit,
  saveVisitorDetails,
  setReceptionMode as storeReceptionMode,
} from '../services/visitorDevice';
import '../home.css';

const TZ = 'Africa/Nairobi';
const TZ_OFFSET = '+03:00';
const OPEN_HOUR = 8;
const CLOSE_HOUR = 17;
const SLOT_MINUTES = 30;
const LEAD_MINUTES = 30;
const BOOKABLE_DAYS = 10;
const RECEPTION_RESET_SECONDS = 20;

const STEPS = ['When', 'Teacher', 'Details', 'Review'];

const VISIT_MODES = [
  { id: 'now', icon: 'pin', title: "I'm here now", sub: 'Waiting at reception' },
  { id: 'onway', icon: 'route', title: 'On my way', sub: 'Arriving shortly' },
  { id: 'later', icon: 'calendar', title: 'Plan a visit', sub: 'Pick a day and time' },
];

const ETA_CHOICES = [10, 15, 30, 45, 60];
const PURPOSES = ['Parent–teacher meeting', 'Admissions enquiry', 'Fees / bursar', 'Student pickup', 'Counselling', 'Other'];

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
  bookedTimes: (Array.isArray(member.booked_times) ? member.booked_times : []).map((value) => new Date(value).getTime()),
});

/** True when the host already has a visit overlapping a 30-minute visit starting at `slotValue`. */
const isSlotTaken = (host, slotValue) => {
  if (!host || !slotValue) return false;
  const start = new Date(slotValue).getTime();
  return host.bookedTimes.some((booked) => Math.abs(booked - start) < SLOT_MINUTES * 60 * 1000);
};

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

/** A fresh form, prefilled with the parent's saved details unless this is a shared reception device. */
const startingVisitor = (receptionMode) => {
  const saved = receptionMode ? null : loadVisitorDetails();
  return saved ? { ...emptyVisitor, name: saved.name, phone: saved.phone, email: saved.email || '' } : emptyVisitor;
};

export default function HomePage() {
  const [receptionMode, setReceptionMode] = useState(isReceptionMode);
  const [returning] = useState(() => (isReceptionMode() ? null : loadVisitorDetails()));
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(() => (isReceptionMode() ? 'now' : null));
  const [eta, setEta] = useState(15);
  const [dayKey, setDayKey] = useState(null);
  const [slot, setSlot] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [visitor, setVisitor] = useState(() => startingVisitor(isReceptionMode()));
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
  const [now, setNow] = useState(() => new Date());
  const [toast, setToast] = useState('');
  const flowRef = useRef(null);
  const toastTimer = useRef(null);

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

  const refreshStaff = useCallback(() => {
    api
      .get('/staff/')
      .then(({ data }) => setStaff((data || []).map(toStaff)))
      .catch(() => {});
  }, []);

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
  const slotStillOpen = slot && slots.some((item) => item.value === slot && item.available && !isSlotTaken(host, item.value));

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
    hostBlockReason(member, visitMode, visitMode === 'later' ? dayKey : null) ||
    (visitMode === 'later' && isSlotTaken(member, slot) ? 'Already booked at that time' : null);
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
    setVisitor(startingVisitor(receptionMode));
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
    storeReceptionMode(next);
    if (next && step === 0 && !mode) setMode('now');
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
        is_scheduled: mode === 'later',
        message: note,
      });
      const id = data?.data?.id;
      const reference = id ? `GP-${String(id).padStart(5, '0')}` : `GP-${String(Date.now()).slice(-6)}`;
      if (!receptionMode) {
        saveVisitorDetails(visitor);
        if (id) saveVisit({ reference, phone: visitor.phone.trim(), hostName: host.name, arrival: arrival.toISOString(), mode });
      }
      setVisit({
        reference,
        arrival: arrival.toISOString(),
        mode,
        eta,
        host,
        visitor: { ...visitor },
      });
      scrollFlowIntoView();
      refreshStaff();
    } catch (error) {
      setSubmitError(describeError(error));
      refreshStaff();
    } finally {
      setSubmitting(false);
    }
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
                          disabled={!item.available || isSlotTaken(host, item.value)}
                          title={isSlotTaken(host, item.value) ? `${hostFirst} is already booked at this time` : undefined}
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
        {!receptionMode && (
          <p className="gp-pass-auto">
            It&apos;s saved in{' '}
            <Link to="/visits">My visits</Link>, where you can check or cancel it any time.
          </p>
        )}
        {receptionMode && <p className="gp-pass-auto">Starting a new check-in in {countdown}s</p>}
      </div>
    );
  };

  const greeting =
    returning && !receptionMode && step === 0 && !visit ? `Welcome back, ${firstName(returning.name)}` : null;

  return (
    <AppShell
      title={receptionMode ? 'Reception desk' : 'Book a visit'}
      hideTabs={receptionMode}
      action={
        <span className={`gp-office ${officeOpen ? '' : 'is-closed'}`}>{officeOpen ? 'School open' : 'School closed'}</span>
      }
    >
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
                    {greeting && <p className="gp-greeting">{greeting}</p>}
                    <p className="gp-eyebrow">
                      Step {step + 1} of {STEPS.length}
                    </p>
                    <h2 id="gp-flow-title">{titles[step]}</h2>
                  </div>
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

      {toast && (
        <div className="gp-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </AppShell>
  );
}
