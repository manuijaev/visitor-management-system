import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_ETA, REVIEW_STEP } from "./constants";
import { blockReason, firstName, isAwayOn, isSlotTaken } from "./hosts";
import { buildDays, buildSlots, hasOpenSlot } from "./schedule";
import useHostSearch from "./useHostSearch";
import useVisitorDetails from "./useVisitorDetails";
import useVisitSubmission from "./useVisitSubmission";

const HOST_ADVANCE_MS = 180;

export default function useBookingFlow({ receptionMode, data, now }) {
  const { staff, hours, refreshStaff } = data;
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(() => (receptionMode ? "now" : null));
  const [eta, setEta] = useState(DEFAULT_ETA);
  const [dayKey, setDayKey] = useState(null);
  const [slot, setSlot] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [visit, setVisit] = useState(null);
  const flowRef = useRef(null);
  const hostAdvanceTimer = useRef(null);
  const details = useVisitorDetails(receptionMode);
  const search = useHostSearch();

  useEffect(() => () => clearTimeout(hostAdvanceTimer.current), []);

  const days = useMemo(() => buildDays(now, hours), [now, hours]);
  const slots = useMemo(
    () => (dayKey ? buildSlots(dayKey, now, hours) : []),
    [dayKey, now, hours],
  );
  const host = staff.find((member) => member.id === hostId) || null;
  const hostFirst = host ? firstName(host.name) : "";
  const slotStillOpen = Boolean(
    slot &&
      slots.some(
        (item) =>
          item.value === slot && item.available && !isSlotTaken(host, slot),
      ),
  );

  useEffect(() => {
    if (dayKey && !days.some((day) => day.key === dayKey)) {
      setDayKey(null);
      setSlot(null);
    }
  }, [days, dayKey]);

  const blockFor = (member, visitMode = mode) =>
    blockReason(member, { mode: visitMode, dayKey, slot });
  const whenOk =
    mode === "now" || mode === "onway" || (mode === "later" && slotStillOpen);
  const hostOk = Boolean(host) && !blockFor(host);
  const stepDone = [whenOk, hostOk, details.complete, false];
  const canOpenStep = (target) => stepDone.slice(0, target).every(Boolean);

  const scrollFlowIntoView = () => {
    const card = flowRef.current;
    if (card?.getBoundingClientRect().top < 0) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const showStep = (target) => {
    setStep(target);
    scrollFlowIntoView();
  };

  const goToStep = (target) => {
    if (target !== step && canOpenStep(target)) showStep(target);
  };

  const advanceFromWhen = (visitMode) =>
    showStep(host && !blockFor(host, visitMode) ? 2 : 1);

  const selectMode = (visitMode) => {
    setMode(visitMode);
    if (visitMode === "now") advanceFromWhen("now");
    if (visitMode === "later" && !dayKey) {
      const firstOpen = days.find(
        (day) => !isAwayOn(host, day.key) && hasOpenSlot(day.key, now, hours),
      );
      if (firstOpen) setDayKey(firstOpen.key);
    }
  };

  const pickDay = (key) => {
    setDayKey(key);
    setSlot(null);
  };

  const pickHost = (member) => {
    setHostId(member.id);
    if (step !== 1) return;
    clearTimeout(hostAdvanceTimer.current);
    hostAdvanceTimer.current = setTimeout(() => showStep(2), HOST_ADVANCE_MS);
  };

  const goNext = () => {
    if (step === 0 && whenOk) advanceFromWhen(mode);
    else if (step === 1 && hostOk) goToStep(2);
    else if (step === 2) {
      details.touchAll();
      if (details.complete) goToStep(REVIEW_STEP);
    }
  };

  const { resetVisitor } = details;
  const { resetSearch } = search;
  const submission = useVisitSubmission({
    receptionMode,
    refreshStaff,
    onSent: (sentVisit) => {
      setVisit(sentVisit);
      scrollFlowIntoView();
    },
  });
  const { clearSubmitError } = submission;

  const resetFlow = useCallback(() => {
    setStep(0);
    setMode(receptionMode ? "now" : null);
    setEta(DEFAULT_ETA);
    setDayKey(null);
    setSlot(null);
    setHostId(null);
    resetVisitor();
    clearSubmitError();
    setVisit(null);
    resetSearch();
  }, [receptionMode, resetVisitor, clearSubmitError, resetSearch]);

  const submit = () =>
    submission.submit({ visitor: details.visitor, host, mode, eta, slot });

  return {
    flowRef,
    step,
    stepDone,
    canOpenStep,
    goToStep,
    goBack: () => setStep(step - 1),
    goNext,
    mode,
    selectMode,
    eta,
    setEta,
    days,
    dayKey,
    pickDay,
    slots,
    slot,
    setSlot,
    slotStillOpen,
    whenOk,
    host,
    hostFirst,
    hostId,
    hostOk,
    pickHost,
    blockFor,
    details,
    search,
    submission,
    submit,
    visit,
    resetFlow,
  };
}
