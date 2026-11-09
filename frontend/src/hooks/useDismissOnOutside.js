import { useEffect } from "react";

export default function useDismissOnOutside(ref, open, close) {
  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (event) => {
      if (!ref.current?.contains(event.target)) close();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, open, close]);
}
