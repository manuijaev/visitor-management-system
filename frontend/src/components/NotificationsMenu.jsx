import { useCallback, useRef, useState } from "react";
import useDismissOnOutside from "../hooks/useDismissOnOutside";
import cn from "./ui/cn";

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

const LEGACY_BUTTON =
  "cursor-pointer [box-shadow:var(--shadow-soft)] hover:-translate-y-px in-data-[console=admin]:[box-shadow:none] in-data-[console=admin]:hover:translate-y-0 motion-safe:transition-all motion-safe:duration-200";

const BELL = `${LEGACY_BUTTON} relative flex size-9 items-center justify-center rounded-lg border-none bg-transparent px-3 py-[11px] font-[inherit] text-[15px] font-semibold text-ink-mid hover:bg-surface-2 hover:text-ink in-data-[console=admin]:p-0 in-data-[console=admin]:[font-size:inherit] in-data-[console=admin]:[line-height:inherit] in-data-[console=admin]:[font-weight:inherit] [&_svg]:size-5 max-[768px]:[&_svg]:size-[18px]`;

const PANEL =
  "absolute top-[calc(100%+8px)] right-0 left-auto z-[100] m-0 h-auto w-80 overflow-hidden rounded-[14px] border border-line bg-surface p-0 text-[inherit] [box-shadow:var(--shadow-float)] max-[768px]:fixed max-[768px]:inset-x-0 max-[768px]:top-0 max-[768px]:bottom-auto max-[768px]:z-[9999] max-[768px]:max-h-[70vh] max-[768px]:w-full max-[768px]:rounded-t-none max-[768px]:rounded-b-[20px] max-[480px]:z-[99999] max-[480px]:max-w-full max-[480px]:transform-none";

const HEADER_ACTION = `${LEGACY_BUTTON} ml-auto w-auto flex-none rounded-md border-none bg-transparent px-2 py-1 font-[inherit] text-[12px] font-semibold text-(--teal) hover:bg-red-light hover:underline in-data-[console=admin]:[font-weight:inherit]`;

const ITEM =
  "group relative flex items-start gap-3 px-4 py-3 max-[768px]:py-3.5 max-[480px]:shrink-0 motion-safe:transition-[background] motion-safe:duration-200";

const OPEN_BUTTON = `${LEGACY_BUTTON} m-0 flex w-auto min-w-0 flex-1 items-start gap-3 border-none bg-transparent p-0 text-left [font:inherit] text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--teal)`;

const DISMISS_BUTTON = `${LEGACY_BUTTON} flex size-8 flex-none items-center justify-center rounded-md border-none bg-transparent p-1 font-[inherit] text-[15px] font-semibold text-ink-faint opacity-0 group-hover:opacity-100 hover:bg-red-light hover:text-(--red-dark) in-data-[console=admin]:[font-size:inherit] in-data-[console=admin]:[line-height:inherit] in-data-[console=admin]:[font-weight:inherit] [@media(hover:none)]:opacity-100 [&_svg]:size-3.5`;

function dotColor(item) {
  if (item.urgent) return "bg-red";
  if (item.unread) return "bg-gold";
  return "bg-(--teal)";
}

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
  const closeMenu = useCallback(() => setOpen(false), []);
  const unread = items.filter((item) => item.unread).length;

  useDismissOnOutside(wrapperRef, open, closeMenu);

  return (
    <>
      {open && (
        <div
          className="hidden max-[768px]:fixed max-[768px]:inset-0 max-[768px]:z-[99998] max-[768px]:block max-[768px]:bg-[rgba(26,23,20,0.35)]"
          aria-hidden="true"
        />
      )}
      <div className="relative max-[480px]:static" ref={wrapperRef}>
        <button
          type="button"
          className={BELL}
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={`Notifications, ${unread} unread`}
        >
          <BellIcon />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-lg bg-red px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
        {open && (
          <dialog open className={PANEL} aria-label="Notifications">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <h4 className="m-0 text-[14px] font-semibold text-ink">
                  Notifications
                </h4>
                {unread > 0 && (
                  <span className="whitespace-nowrap rounded-[10px] bg-gold-light px-2 py-0.5 text-[11px] font-medium text-gold-dark">
                    {unread} unread
                  </span>
                )}
              </div>
              {action && items.length > 0 && (
                <button
                  type="button"
                  className={HEADER_ACTION}
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              )}
            </div>
            <div className="max-h-[360px] overflow-y-auto max-[768px]:max-h-[calc(70vh-60px)]">
              {items.length === 0 ? (
                <div className="p-[30px] text-center text-[13px] text-ink-faint">
                  <div className="mb-3 opacity-40 [&_svg]:size-8">
                    <BellIcon />
                  </div>
                  <p>You&apos;re all caught up.</p>
                </div>
              ) : (
                items.slice(0, limit).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      ITEM,
                      item.unread ? "bg-gold-light" : "hover:bg-surface-2",
                    )}
                  >
                    <button
                      type="button"
                      className={OPEN_BUTTON}
                      onClick={() => {
                        onOpenItem(item);
                        setOpen(false);
                      }}
                    >
                      <span
                        className={`mt-1.5 block size-2 shrink-0 rounded-[50%] ${dotColor(item)}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="mb-1 block text-[13px] leading-[1.4] text-ink">
                          {item.text}
                        </span>
                        {item.time && (
                          <span className="text-[11px] text-ink-faint">
                            {item.time}
                          </span>
                        )}
                      </span>
                    </button>
                    {onDismiss && (
                      <button
                        type="button"
                        className={DISMISS_BUTTON}
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
    </>
  );
}
