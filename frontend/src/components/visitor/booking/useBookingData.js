import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import { toStaff } from "./hosts";
import { DEFAULT_HOURS, toHours } from "./schedule";

const toStaffList = (data) => (data || []).map(toStaff);

export default function useBookingData() {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(DEFAULT_HOURS);

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/staff/"), api.get("/departments/")])
      .then(([staffRes, deptRes]) => {
        if (!active) return;
        setStaff(toStaffList(staffRes.data));
        setDepartments(deptRes.data || []);
      })
      .catch((error) => console.error("Failed to load hosts", error))
      .finally(() => active && setLoading(false));
    api
      .get("/office-hours/")
      .then(({ data }) => active && setHours(toHours(data)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const refreshStaff = useCallback(() => {
    api
      .get("/staff/")
      .then(({ data }) => setStaff(toStaffList(data)))
      .catch(() => {});
  }, []);

  return { staff, departments, loading, hours, refreshStaff };
}
