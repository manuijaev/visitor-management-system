import { useEffect, useState, useSyncExternalStore } from "react";
import { detectPlatform, snoozeInstall, subscribe } from "../services/pwa";
import ContinueCard from "./install-prompt/ContinueCard";
import InstallCard from "./install-prompt/InstallCard";
import IosGuide from "./install-prompt/IosGuide";
import { installSnapshot, pickMode } from "./install-prompt/helpers";

const SHOW_DELAY_MS = 2500;

export default function InstallPrompt() {
  const [platform] = useState(detectPlatform);
  const [ready, setReady] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  useSyncExternalStore(subscribe, installSnapshot);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const mode = pickMode(platform);
  if (!ready || !mode) return null;

  const snoozeFor = (days) => {
    setGuideOpen(false);
    snoozeInstall(days);
  };

  if (mode === "continue") {
    return <ContinueCard platform={platform} />;
  }

  if (mode === "ios" && guideOpen) {
    return (
      <IosGuide
        platform={platform}
        onClose={() => setGuideOpen(false)}
        onGotIt={() => snoozeFor(1)}
        onNotNow={() => snoozeFor()}
      />
    );
  }

  return (
    <InstallCard
      mode={mode}
      platform={platform}
      onNotNow={() => snoozeFor()}
      onShowGuide={() => setGuideOpen(true)}
    />
  );
}
