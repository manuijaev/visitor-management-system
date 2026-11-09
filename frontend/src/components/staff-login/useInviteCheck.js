import { useEffect, useState } from "react";
import api from "../../services/api";
import { extractErrorMessage } from "./extractErrorMessage";

const EMPTY_INVITE = { fullName: "", email: "", message: "" };

export function useInviteCheck(inviteUid, inviteToken) {
  const isInvite = Boolean(inviteUid && inviteToken);
  const [invite, setInvite] = useState({
    ...EMPTY_INVITE,
    status: isInvite ? "checking" : "none",
  });

  useEffect(() => {
    if (!isInvite) {
      setInvite({ ...EMPTY_INVITE, status: "none" });
      return undefined;
    }
    let cancelled = false;
    setInvite((prev) => ({ ...prev, status: "checking" }));
    api
      .get("/staff/invite/", { params: { uid: inviteUid, token: inviteToken } })
      .then(({ data }) => {
        if (cancelled) return;
        setInvite({
          status: "ready",
          fullName: data.full_name,
          email: data.email,
          message: "",
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setInvite({
          ...EMPTY_INVITE,
          status: "invalid",
          message: extractErrorMessage(
            err,
            "This link is invalid or has expired.",
          ),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [isInvite, inviteUid, inviteToken]);

  return { isInvite, invite };
}
