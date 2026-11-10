import { promptInstall } from "../../services/pwa";
import PwaButton from "./PwaButton";
import PwaCard from "./PwaCard";
import PwaHead, { PWA_ACTIONS } from "./PwaHead";
import { installHint } from "./helpers";

const DEFAULT_HINT =
  "Open Gatepass from your home screen or desktop, full screen, with visitor alerts.";

export default function InstallCard({ mode, platform, onNotNow, onShowGuide }) {
  return (
    <PwaCard labelledBy="pwa-install-title">
      <PwaHead titleId="pwa-install-title" title="Install the Gatepass app">
        {installHint(mode, platform) || DEFAULT_HINT}
      </PwaHead>
      <div className={PWA_ACTIONS}>
        <PwaButton onClick={onNotNow}>Not now</PwaButton>
        {mode === "install" && (
          <PwaButton variant="primary" onClick={promptInstall}>
            Install
          </PwaButton>
        )}
        {mode === "ios" && (
          <PwaButton variant="primary" onClick={onShowGuide}>
            Show me how
          </PwaButton>
        )}
      </div>
    </PwaCard>
  );
}
