import { useState } from "react";
import ModalDialog from "../ModalDialog";
import PwaButton from "./PwaButton";
import PwaHead, { PWA_ACTIONS, PWA_SURFACE } from "./PwaHead";
import { iosSteps } from "./iosSteps";

export default function IosGuide({ platform, onClose, onGotIt, onNotNow }) {
  const [copied, setCopied] = useState(false);
  const guide = iosSteps(platform);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      window.prompt(
        "Copy this link and open it in Safari:",
        window.location.href,
      );
    }
  };

  return (
    <ModalDialog
      className={`${PWA_SURFACE} mx-auto mb-0 mt-auto max-h-[88vh] w-[min(520px,100%)] max-w-full overflow-y-auto rounded-t-3xl border-b-0 p-0 outline-none backdrop:bg-[rgba(26,23,20,0.45)] motion-safe:animate-[pwa-rise_0.3s_cubic-bezier(0.2,0.8,0.2,1)_both] motion-safe:backdrop:animate-[pwa-fade_0.2s_ease_both]`}
      aria-labelledby="pwa-guide-title"
      onClose={onClose}
    >
      <div className="px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-2.5">
        <div
          className="mx-auto mb-4 mt-0 h-[5px] w-[42px] rounded-[999px] bg-line"
          aria-hidden="true"
        />
        <PwaHead
          titleId="pwa-guide-title"
          title={`Install Gatepass on your ${platform.device}`}
        >
          {guide.intro}
        </PwaHead>
        <ol className="mx-0 mb-0 mt-[18px] grid list-none gap-2.5 p-0">
          {guide.steps.map((step, index) => (
            <li
              key={step.id}
              className="grid grid-cols-[22px_40px_1fr] items-center gap-3 rounded-[14px] bg-bg p-3 text-[14px] leading-[1.45] text-ink-mid"
            >
              <span className="text-center font-['JetBrains_Mono',monospace] text-[13px] font-semibold leading-none text-gold-dark">
                {index + 1}
              </span>
              <span className="grid size-10 place-items-center rounded-xl border border-solid border-line bg-surface text-[#0062cc]">
                {step.icon}
              </span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
        {guide.showCopyLink && (
          <PwaButton className="mt-3.5 w-full" onClick={copyLink}>
            {copied ? "Link copied" : "Copy link"}
          </PwaButton>
        )}
        <div className={PWA_ACTIONS}>
          <PwaButton onClick={onNotNow}>Not now</PwaButton>
          <PwaButton variant="primary" onClick={onGotIt}>
            Got it
          </PwaButton>
        </div>
      </div>
    </ModalDialog>
  );
}
