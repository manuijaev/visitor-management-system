import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function useAdminExists() {
  const [adminExists, setAdminExists] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    void api
      .get("/staff/")
      .then(({ data }) =>
        setAdminExists(data.some((member) => member.role === "Admin")),
      )
      .catch(() => setAdminExists(false))
      .finally(() => setChecking(false));
  }, []);

  return { adminExists, checking };
}
