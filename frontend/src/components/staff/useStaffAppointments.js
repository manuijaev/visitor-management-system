import { useEffect, useRef, useState } from "react";
import { useAppointments } from "../../context/AppointmentContext";

const REFRESH_MS = 15000;

export default function useStaffAppointments(onLoadFailed) {
  const { appointments, loadMyAppointments, updateAppointment } =
    useAppointments();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const onLoadFailedRef = useRef(onLoadFailed);

  useEffect(() => {
    onLoadFailedRef.current = onLoadFailed;
  });

  useEffect(() => {
    void loadMyAppointments().catch(() => onLoadFailedRef.current?.());
    const intervalId = setInterval(() => {
      void loadMyAppointments().catch(() => {});
    }, REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [loadMyAppointments]);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), REFRESH_MS);
    return () => clearInterval(timerId);
  }, []);

  return { appointments, loadMyAppointments, updateAppointment, currentTime };
}
