import { useCallback, useState } from "react";
import api from "../../../services/api";
import { saveVisit, saveVisitorDetails } from "../../../services/visitorDevice";
import {
  appointmentPayload,
  arrivalTime,
  describeError,
  visitReference,
} from "./visit";

function rememberVisit({ visitor, host, mode, arrival, id, reference }) {
  saveVisitorDetails(visitor);
  if (!id) return;
  saveVisit({
    reference,
    phone: visitor.phone.trim(),
    hostName: host.name,
    arrival,
    mode,
  });
}

export default function useVisitSubmission({
  receptionMode,
  refreshStaff,
  onSent,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const submit = async ({ visitor, host, mode, eta, slot }) => {
    if (!host || submitting) return;
    const arrival = arrivalTime({ mode, eta, slot });
    setSubmitting(true);
    setSubmitError("");
    try {
      const { data } = await api.post(
        "/appointments/create/",
        appointmentPayload({ visitor, host, mode, arrival }),
      );
      const id = data?.data?.id;
      const visit = {
        reference: visitReference(id),
        arrival: arrival.toISOString(),
        mode,
        eta,
        host,
        visitor: { ...visitor },
      };
      if (!receptionMode) rememberVisit({ ...visit, id });
      onSent(visit);
    } catch (error) {
      setSubmitError(describeError(error));
    } finally {
      setSubmitting(false);
      refreshStaff();
    }
  };

  const clearSubmitError = useCallback(() => setSubmitError(""), []);

  return { submitting, submitError, submit, clearSubmitError };
}
