import * as DialogPrimitive from "@radix-ui/react-dialog";
import cn from "./cn";

const OVERLAYS = {
  card: "bg-[rgba(26,23,20,0.45)] backdrop-blur-[4px]",
  modal:
    "bg-[rgba(26,23,20,0.42)] backdrop-blur-[3px] motion-safe:animate-[adFade_0.18s_ease]",
  drawer:
    "bg-[rgba(26,23,20,0.42)] backdrop-blur-[3px] motion-safe:animate-[adFade_0.18s_ease]",
  sheet: "bg-black/50",
  bare: "bg-[rgba(26,23,20,0.45)]",
};

const CENTERED = "inset-0 m-auto h-fit";

const BARE = "border-none p-0";

const CONTENTS = {
  card: `${CENTERED} w-full max-w-[min(400px,calc(100%-40px))] rounded-2xl border border-line bg-white p-6 text-ink [box-shadow:var(--shadow-float)] motion-safe:animate-[modalIn_0.25s_ease_forwards]`,
  modal: `${CENTERED} ${BARE} flex max-h-[calc(100vh-32px)] w-[min(560px,calc(100%-32px))] max-w-full flex-col overflow-auto rounded-3xl bg-surface [box-shadow:var(--shadow-float)] motion-safe:animate-[adPop_0.18s_ease]`,
  drawer: `${BARE} inset-y-0 right-0 m-0 flex overflow-auto h-full max-h-full w-[min(520px,100%)] max-w-full flex-col rounded-l-3xl bg-surface [box-shadow:var(--shadow-float)] max-[760px]:rounded-none motion-safe:animate-[adSlideIn_0.24s_cubic-bezier(0.2,0.8,0.2,1)]`,
  sheet: `${CENTERED} ${BARE} flex max-h-[90vh] w-[calc(100%-40px)] max-w-[480px] flex-col overflow-hidden rounded-[20px] bg-surface`,
  bare: "inset-0 h-fit",
};

export const DialogRoot = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({
  look = "card",
  className,
  dismissible = true,
  onEscapeKeyDown,
  children,
  ...props
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn("fixed inset-0 z-[100000]", OVERLAYS[look])}
      />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        className={cn(
          "fixed z-[100000] outline-none",
          CONTENTS[look],
          className,
        )}
        onEscapeKeyDown={(event) => {
          if (!dismissible) {
            event.preventDefault();
            return;
          }
          onEscapeKeyDown?.(event);
        }}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export default function Dialog({ open = true, onClose, children, ...props }) {
  return (
    <DialogRoot
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <DialogContent {...props}>{children}</DialogContent>
    </DialogRoot>
  );
}
