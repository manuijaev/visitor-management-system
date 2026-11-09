import { useState } from "react";
import respondToVisit from "./respondToVisit";
import { rescheduleTimeError, statusUpdateError } from "./utils";

const CLOSE_CONFIRM_DELAY_MS = 220;
const CONFIRMATION_TOAST_MS = 2500;

const setKey = (setter, id, value) =>
  setter((prev) => ({ ...prev, [id]: value }));

export default function useStatusResponse({
  appointments,
  updateAppointment,
  showToast,
}) {
  const [notes, setNotes] = useState({});
  const [rescheduleTo, setRescheduleTo] = useState({});
  const [actions, setActions] = useState({});
  const [openAreas, setOpenAreas] = useState({});
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const findAppointment = (id) => appointments.find((item) => item.id === id);
  const closeResponseArea = (id) => setKey(setOpenAreas, id, false);

  const openResponseArea = (id, action = "Accepted") => {
    setKey(setActions, id, action);
    setKey(setOpenAreas, id, true);
  };

  const requestStatusUpdate = (appointmentId, visitorName, status) => {
    const newTime =
      status === "Rescheduled" ? rescheduleTo[appointmentId] : null;
    if (status === "Rescheduled") {
      const problem = rescheduleTimeError(
        newTime,
        findAppointment(appointmentId),
      );
      if (problem) {
        showToast(problem);
        return false;
      }
    }
    setPendingUpdate({ appointmentId, visitorName, status, newTime });
    return true;
  };

  const chooseResponse = (item, status) => {
    setKey(setActions, item.id, status);
    return requestStatusUpdate(item.id, item.visitor_name, status);
  };

  const confirmStatusUpdate = async () => {
    if (!pendingUpdate) return;
    const { appointmentId, status } = pendingUpdate;
    setIsSending(true);
    try {
      const confirmation = await respondToVisit({
        appointment: findAppointment(appointmentId),
        appointmentId,
        status,
        note: notes[appointmentId] || "",
        rescheduleValue: rescheduleTo[appointmentId],
        updateAppointment,
      });
      closeResponseArea(appointmentId);
      setKey(setNotes, appointmentId, "");
      setTimeout(() => setPendingUpdate(null), CLOSE_CONFIRM_DELAY_MS);
      if (confirmation) showToast(confirmation, CONFIRMATION_TOAST_MS);
    } catch (err) {
      showToast(statusUpdateError(err));
      setPendingUpdate(null);
    } finally {
      setIsSending(false);
    }
  };

  const cancelStatusUpdate = () => {
    if (!isSending) setPendingUpdate(null);
  };

  return {
    notes,
    rescheduleTo,
    actions,
    openAreas,
    pendingUpdate,
    isSending,
    setNote: (id, value) => setKey(setNotes, id, value),
    setRescheduleTime: (id, value) => setKey(setRescheduleTo, id, value),
    openResponseArea,
    closeResponseArea,
    requestStatusUpdate,
    chooseResponse,
    confirmStatusUpdate,
    cancelStatusUpdate,
  };
}
