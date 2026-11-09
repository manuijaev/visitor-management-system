import { useEffect, useRef } from "react";

export default function ModalDialog({
  className,
  onClose,
  dismissible = true,
  children,
  ...rest
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={className}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose?.();
      }}
      {...rest}
    >
      {children}
    </dialog>
  );
}
