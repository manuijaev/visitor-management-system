import { useMemo, useState } from "react";
import NotificationsMenu from "../../NotificationsMenu";
import { getRelativeTimeLabel } from "../utils";
import { buildNotifications } from "./helpers";

const addId = (id) => (previous) => new Set(previous).add(id);

export default function AdminNotifications({ appointments, onOpenItem }) {
  const [readIds, setReadIds] = useState(() => new Set());
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  const all = useMemo(() => buildNotifications(appointments), [appointments]);
  const visible = all.filter((item) => !dismissedIds.has(item.id));
  const items = visible.map((item) => ({
    id: item.id,
    text: item.message ? `${item.title}. ${item.message}` : item.title,
    time: getRelativeTimeLabel(item.timestamp),
    unread: !readIds.has(item.id),
    urgent: item.urgent,
  }));
  const hasUnread = items.some((item) => item.unread);

  return (
    <NotificationsMenu
      items={items}
      onOpenItem={(item) => {
        setReadIds(addId(item.id));
        onOpenItem();
      }}
      onDismiss={(id) => setDismissedIds(addId(id))}
      action={
        hasUnread
          ? {
              label: "Mark all read",
              onClick: () =>
                setReadIds(new Set(visible.map((item) => item.id))),
            }
          : null
      }
    />
  );
}
