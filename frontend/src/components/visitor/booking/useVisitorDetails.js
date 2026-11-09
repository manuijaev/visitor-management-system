import { useCallback, useState } from "react";
import { isValidEmail } from "../../../services/validation";
import { isValidPhone, startingVisitor } from "./visit";

const CONTACT_FIELDS = { name: true, phone: true, email: true };

export default function useVisitorDetails(receptionMode) {
  const [visitor, setVisitor] = useState(() => startingVisitor(receptionMode));
  const [touched, setTouched] = useState({});

  const valid = {
    name: visitor.name.trim().length >= 2,
    phone: isValidPhone(visitor.phone),
    email: !visitor.email.trim() || isValidEmail(visitor.email),
  };

  const updateVisitor = (field, value) =>
    setVisitor((prev) => ({ ...prev, [field]: value }));
  const touch = (field) => setTouched((prev) => ({ ...prev, [field]: true }));
  const touchAll = () => setTouched(CONTACT_FIELDS);

  const resetVisitor = useCallback(() => {
    setVisitor(startingVisitor(receptionMode));
    setTouched({});
  }, [receptionMode]);

  return {
    visitor,
    touched,
    valid,
    complete: valid.name && valid.phone && valid.email,
    updateVisitor,
    touch,
    touchAll,
    resetVisitor,
  };
}
