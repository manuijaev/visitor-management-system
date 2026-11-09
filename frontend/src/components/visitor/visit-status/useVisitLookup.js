import { useEffect, useRef, useState } from "react";
import api from "../../../services/api";
import { errorMessage } from "./visitStatus";

export default function useVisitLookup({ initialReference, initialPhone }) {
  const [reference, setReference] = useState(initialReference);
  const [phone, setPhone] = useState(initialPhone);
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const credentials = { reference: reference.trim(), phone: phone.trim() };
  const canLookUp = Boolean(credentials.reference && credentials.phone);

  const lookUp = async (event) => {
    event?.preventDefault();
    if (!canLookUp || loading) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/visits/lookup/", credentials);
      setVisit(data);
    } catch (err) {
      setVisit(null);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const autoLookUp = useRef(initialReference && initialPhone ? lookUp : null);
  useEffect(() => {
    if (autoLookUp.current) void autoLookUp.current();
  }, []);

  const cancelVisit = async () => {
    setCancelling(true);
    setError("");
    try {
      const { data } = await api.post("/visits/cancel/", credentials);
      setVisit(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCancelling(false);
      setConfirmingCancel(false);
    }
  };

  const startOver = () => {
    setVisit(null);
    setError("");
  };

  return {
    reference,
    setReference,
    phone,
    setPhone,
    visit,
    loading,
    error,
    canLookUp,
    lookUp,
    startOver,
    confirmingCancel,
    askToCancel: () => setConfirmingCancel(true),
    dismissCancel: () => !cancelling && setConfirmingCancel(false),
    cancelling,
    cancelVisit,
  };
}
