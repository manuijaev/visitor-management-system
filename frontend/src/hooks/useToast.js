import { useCallback, useEffect, useRef, useState } from "react";

export default function useToast(defaultDuration = 3200) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const clearToast = useCallback(() => {
    clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback(
    (value, duration = defaultDuration) => {
      clearTimeout(timerRef.current);
      setToast(value);
      timerRef.current = setTimeout(() => setToast(null), duration);
    },
    [defaultDuration],
  );

  return { toast, showToast, clearToast };
}
