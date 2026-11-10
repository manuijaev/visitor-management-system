import { useState } from "react";
import { dismissContinueInApp } from "../../services/pwa";
import PwaButton from "./PwaButton";
import PwaCard from "./PwaCard";
import PwaHead, { PWA_ACTIONS } from "./PwaHead";
import { continueSteps } from "./helpers";

export default function ContinueCard({ platform }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <PwaCard labelledBy="pwa-continue-title">
      <PwaHead
        titleId="pwa-continue-title"
        title="Continue in the Gatepass app"
      >
        Gatepass is installed on this device. The app opens full screen and
        keeps you signed in for visitor alerts.
      </PwaHead>
      {showHelp && (
        <p className="mx-0 mb-0 mt-3 rounded-xl bg-gold-light px-3 py-2.5 text-[14px] leading-normal text-ink-mid">
          {continueSteps(platform)}
        </p>
      )}
      <div className={PWA_ACTIONS}>
        <PwaButton onClick={dismissContinueInApp}>Stay in browser</PwaButton>
        {!showHelp && (
          <PwaButton variant="primary" onClick={() => setShowHelp(true)}>
            Open app
          </PwaButton>
        )}
      </div>
    </PwaCard>
  );
}
