import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../services/api";
import {
  clearSession,
  flashSessionExpired,
  hasStoredUser,
  hasUsableSession,
  isValidUser,
  readStoredUser,
} from "../services/session";

const AuthContext = createContext(null);
const AUTH_SYNC_CHANNEL = "auth-sync-channel";

export function AuthProvider({ children }) {
  const channelRef = useRef(null);
  const [user, setUser] = useState(() => {
    if (hasUsableSession()) return readStoredUser();
    if (hasStoredUser()) flashSessionExpired();
    clearSession();
    return null;
  });

  useEffect(() => {
    if (!user) return undefined;
    const check = () => {
      if (hasUsableSession()) return;
      clearSession();
      flashSessionExpired();
      setUser(null);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    const id = setInterval(check, 60000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof BroadcastChannel === "undefined"
    )
      return;
    const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const payload = event?.data || {};
      if (payload.type === "auth:login" && isValidUser(payload.user)) {
        setUser(payload.user);
      }
      if (payload.type === "auth:logout") {
        setUser(null);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === "user") {
        setUser(readStoredUser());
      }
      if (event.key === "access_token" && !event.newValue) {
        setUser(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const startSession = (data) => {
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    channelRef.current?.postMessage({ type: "auth:login", user: data.user });
    return data.user;
  };

  const login = async (email, password) => {
    const { data } = await api.post("/staff/login/", { email, password });
    return startSession(data);
  };

  const acceptInvite = async (uid, token, password) => {
    const { data } = await api.post("/staff/invite/accept/", {
      uid,
      token,
      password,
    });
    return startSession(data);
  };

  const logout = () => {
    clearSession();
    setUser(null);
    channelRef.current?.postMessage({ type: "auth:logout" });
  };

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("user", JSON.stringify(next));
      channelRef.current?.postMessage({ type: "auth:login", user: next });
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, login, acceptInvite, logout, updateUser }),
    [user, updateUser, login, acceptInvite, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
