import { PWA_SURFACE } from "./PwaHead";

const CARD =
  "fixed bottom-[18px] left-[18px] right-auto top-auto z-[1100] m-0 w-[min(380px,calc(100vw-36px))] rounded-[18px] p-[18px] max-[640px]:bottom-[calc(12px+env(safe-area-inset-bottom))] max-[640px]:left-3 max-[640px]:right-3 max-[640px]:w-auto max-[760px]:[body:has(.app-tabbar)_&]:bottom-[calc(74px+env(safe-area-inset-bottom))] [body:has([data-gp-tabbar])_&]:bottom-[calc(74px+env(safe-area-inset-bottom))] motion-safe:animate-[pwa-rise_0.35s_cubic-bezier(0.2,0.8,0.2,1)_both]";

export default function PwaCard({ labelledBy, children }) {
  return (
    <dialog
      open
      className={`${PWA_SURFACE} ${CARD}`}
      aria-labelledby={labelledBy}
    >
      {children}
    </dialog>
  );
}
