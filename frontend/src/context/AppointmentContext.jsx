import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

const AppointmentContext = createContext(null);

export function AppointmentProvider({ children }) {
  const [appointments, setAppointments] = useState([]);

  const loadMyAppointments = useCallback(async () => {
    const { data } = await api.get("/appointments/my/");
    setAppointments(Array.isArray(data) ? data : []);
  }, []);

  const updateAppointment = useCallback(
    async (id, payload) => {
      await api.patch(`/appointments/update/${id}/`, payload);
      await loadMyAppointments();
    },
    [loadMyAppointments],
  );

  const value = useMemo(
    () => ({ appointments, loadMyAppointments, updateAppointment }),
    [appointments, loadMyAppointments, updateAppointment],
  );

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  return useContext(AppointmentContext);
}
