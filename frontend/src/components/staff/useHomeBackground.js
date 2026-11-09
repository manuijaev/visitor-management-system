import { useEffect } from "react";

export default function useHomeBackground() {
  useEffect(() => {
    document.body.classList.remove(
      "home-background",
      "auth-background",
      "dashboard-background",
    );
    document.body.classList.add("home-background");
    return () => {
      document.body.classList.remove("home-background");
    };
  }, []);
}
