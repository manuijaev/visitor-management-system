import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { REFRESH_INTERVAL_MS } from "./constants";
import { asList } from "./helpers";

const EMPTY = {
  departments: [],
  divisions: [],
  staff: [],
  appointments: [],
  loaded: false,
};

export default function useAdminData(notify) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [data, setData] = useState(EMPTY);

  const loadData = useCallback(async () => {
    try {
      const [departments, divisions, staff, appointments] = await Promise.all([
        api.get("/departments/"),
        api.get("/divisions/"),
        api.get("/staff/?include_inactive=1"),
        api.get("/appointments/my/"),
      ]);
      setData({
        departments: asList(departments.data),
        divisions: asList(divisions.data),
        staff: asList(staff.data),
        appointments: asList(appointments.data),
        loaded: true,
      });
    } catch (error) {
      if (error?.response?.status === 401) {
        logout();
        navigate("/staff");
        return;
      }
      notify("Could not refresh data.", "error");
    }
  }, [logout, navigate, notify]);

  useEffect(() => {
    if (!user) return undefined;
    void loadData();
    const id = setInterval(loadData, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user, loadData]);

  return { ...data, loadData };
}
