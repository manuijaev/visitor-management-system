import { useEffect, useRef, useState } from "react";
import { RECEPTION_RESET_SECONDS } from "./constants";

export default function useResetCountdown(active, onDone) {
  const [countdown, setCountdown] = useState(RECEPTION_RESET_SECONDS);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!active) return undefined;
    let remaining = RECEPTION_RESET_SECONDS;
    setCountdown(remaining);
    const timer = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        return;
      }
      clearInterval(timer);
      setCountdown(RECEPTION_RESET_SECONDS);
      onDoneRef.current();
    }, 1000);
    return () => clearInterval(timer);
  }, [active]);

  return countdown;
}
