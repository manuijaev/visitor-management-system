import { useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function useAvailability(showToast) {
  const { user, updateUser } = useAuth();
  const [isAvailable, setIsAvailable] = useState(user?.is_available ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const toggleAvailability = async () => {
    if (isSaving) return;
    const nextState = !isAvailable;
    setIsSaving(true);
    try {
      const { data } = await api.patch("/staff/me/availability/", {
        is_available: nextState,
      });
      const updatedUser = data?.user || {};
      updateUser(updatedUser);
      setIsAvailable(updatedUser.is_available ?? nextState);
      showToast(
        nextState
          ? "You are now available for visitors."
          : "Visitors will see you as unavailable until you toggle back.",
      );
    } catch (err) {
      showToast(
        err?.response?.data?.detail ||
          "Failed to update availability. Try again in a moment.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return { isAvailable, isSaving, toggleAvailability };
}
