import { useEffect, useRef, useState } from "react";

const BellIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

/**
 * The bell in the top bar and its dropdown, shared by the staff and admin apps.
 * On phones the dropdown drops from the top of the screen over a dimmed backdrop.
 *
 * @param {{
 *   items: Array<{ id: string|number, text: string, time?: string, unread: boolean, urgent?: boolean }>,
 *   onOpenItem: (item: object) => void,
 *   onDismiss?: (id: string|number) => void,
 *   action?: { label: string, onClick: () => void } | null,
 *   limit?: number,
 * }} props
 */
export default function NotificationsMenu({
  items,
  onOpenItem,
  onDismiss,
  action = null,
  limit = 10,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const unread = items.filter((item) => item.unread).length;

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target))
        setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="sd-notification-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="sd-icon-btn"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Notifications, ${unread} unread`}
      >
        <BellIcon />
        {unread > 0 && (
          <span className="sd-notification-badge">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="sd-notification-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      {open && (
        <dialog
          open
          className="sd-notification-dropdown"
          aria-label="Notifications"
        >
          <div className="sd-notification-header">
            <div className="sd-notification-header-left">
              <h4>Notifications</h4>
              {unread > 0 && (
                <span className="sd-notification-count">{unread} unread</span>
              )}
            </div>
            {action && items.length > 0 && (
              <button
                type="button"
                className="sd-clear-all-btn"
                onClick={action.onClick}
              >
                {action.label}
              </button>
            )}
          </div>
          <div className="sd-notification-list">
            {items.length === 0 ? (
              <div className="sd-notification-empty">
                <div className="sd-notification-empty-icon">
                  <BellIcon />
                </div>
                <p>You&apos;re all caught up.</p>
              </div>
            ) : (
              items.slice(0, limit).map((item) => (
                <div
                  key={item.id}
                  className={`sd-notification-item ${item.unread ? "unread" : ""} ${item.urgent ? "urgent" : ""}`}
                >
                  <button
                    type="button"
                    className="sd-notification-open"
                    onClick={() => {
                      onOpenItem(item);
                      setOpen(false);
                    }}
                  >
                    <span className="sd-notification-dot" aria-hidden="true" />
                    <span className="sd-notification-content">
                      <span className="sd-notification-text">{item.text}</span>
                      {item.time && (
                        <span className="sd-notification-time">
                          {item.time}
                        </span>
                      )}
                    </span>
                  </button>
                  {onDismiss && (
                    <button
                      type="button"
                      className="sd-notification-clear"
                      onClick={() => onDismiss(item.id)}
                      aria-label="Dismiss notification"
                    >
                      <CloseIcon />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
