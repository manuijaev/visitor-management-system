import { useEffect, useState, useSyncExternalStore } from "react";
import LogoMark from "./LogoMark";
import ModalDialog from "./ModalDialog";
import {
  detectPlatform,
  dismissContinueInApp,
  getDeferredPrompt,
  isContinueInAppDismissed,
  isInstallSnoozed,
  isMarkedInstalled,
  isStandalone,
  promptInstall,
  snoozeInstall,
  subscribe,
} from "../services/pwa";
import "./install-prompt.css";

const SHOW_DELAY_MS = 2500;

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="pwa-glyph">
      <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
      <path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" />
    </svg>
  );
}

function AddSquareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="pwa-glyph">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="pwa-glyph is-filled">
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}

function iosSteps(platform) {
  const { browser, iosVersion, iosCanInstallHere } = platform;

  if (!iosCanInstallHere) {
    return {
      intro:
        browser === "inapp"
          ? "This page is open inside another app. Open it in Safari to add Gatepass to your Home Screen."
          : "Your iOS version only allows adding apps from Safari. Open this page in Safari to continue.",
      steps: [
        {
          id: "open-in-safari",
          icon: <DotsIcon />,
          text: (
            <>
              Tap <strong>⋯</strong> or the compass icon and choose{" "}
              <strong>Open in Safari</strong>. You can also copy the link below
              and paste it into Safari.
            </>
          ),
        },
        {
          id: "share-from-safari",
          icon: <ShareIcon />,
          text: (
            <>
              In Safari, tap <strong>Share</strong> and then{" "}
              <strong>Add to Home Screen</strong>.
            </>
          ),
        },
      ],
      showCopyLink: true,
    };
  }

  const shareStep = {
    safari: (
      <>
        Tap the <strong>Share</strong> button in Safari&apos;s toolbar. On newer
        iPhones, tap <strong>⋯</strong> first, then <strong>Share</strong>.
      </>
    ),
    chrome: (
      <>
        Tap the <strong>Share</strong> button at the right of Chrome&apos;s
        address bar.
      </>
    ),
    edge: (
      <>
        Tap <strong>⋯</strong> at the bottom of Edge, then{" "}
        <strong>Share</strong>.
      </>
    ),
    firefox: (
      <>
        Tap the <strong>☰</strong> menu in Firefox, then <strong>Share</strong>
        .
      </>
    ),
  }[browser] || (
    <>
      Open your browser&apos;s menu and tap <strong>Share</strong>.
    </>
  );

  const steps = [
    { id: "share", icon: <ShareIcon />, text: shareStep },
    {
      id: "add-to-home-screen",
      icon: <AddSquareIcon />,
      text: (
        <>
          Scroll down and tap <strong>Add to Home Screen</strong>. If you
          don&apos;t see it, tap <strong>View More</strong> or{" "}
          <strong>Edit Actions</strong>.
        </>
      ),
    },
    {
      id: "confirm-add",
      icon: <span className="pwa-step-add">Add</span>,
      text:
        iosVersion >= 26 ? (
          <>
            Leave <strong>Open as Web App</strong> switched on and tap{" "}
            <strong>Add</strong>.
          </>
        ) : (
          <>
            Tap <strong>Add</strong> in the top-right corner.
          </>
        ),
    },
    {
      id: "open-app",
      icon: <LogoMark className="pwa-step-logo" />,
      text: (
        <>
          Open <strong>Gatepass</strong> from your Home Screen and sign in.
          Visitor alerts on iPhone only work from the Home Screen app.
        </>
      ),
    },
  ];

  return {
    intro:
      "Add Gatepass to your Home Screen for full-screen access and visitor alerts.",
    steps,
    showCopyLink: false,
  };
}

function continueSteps(platform) {
  if (platform.os === "android") {
    return 'Tap ⋮ in Chrome and choose "Open in Gatepass", or tap the Gatepass icon on your home screen.';
  }
  return 'Click the "Open in app" icon at the right end of the address bar, or open Gatepass from your Start menu, Dock or app launcher.';
}

function manualHint(platform) {
  if (platform.macSafariCanInstall)
    return "In Safari, choose File › Add to Dock to install Gatepass.";
  if (platform.os === "android" && platform.browser === "firefox")
    return "Tap ⋮ in Firefox and choose Install to add Gatepass to your home screen.";
  return null;
}

function installSnapshot() {
  return `${Boolean(getDeferredPrompt())}|${isMarkedInstalled()}|${isInstallSnoozed()}|${isContinueInAppDismissed()}`;
}

function pickMode(platform) {
  if (isStandalone()) return null;
  if (getDeferredPrompt() && !isInstallSnoozed()) return "install";
  if (isMarkedInstalled())
    return isContinueInAppDismissed() || platform.os === "ios"
      ? null
      : "continue";
  if (isInstallSnoozed()) return null;
  if (platform.os === "ios") return "ios";
  if (manualHint(platform)) return "manual";
  return null;
}

export default function InstallPrompt() {
  const [platform] = useState(detectPlatform);
  const [ready, setReady] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [showContinueHelp, setShowContinueHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  useSyncExternalStore(subscribe, installSnapshot);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const mode = pickMode(platform);
  if (!ready || !mode) return null;

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

  const closeGuide = () => setGuideOpen(false);
  const gotIt = () => {
    setGuideOpen(false);
    snoozeInstall(1);
  };
  const notNow = () => {
    setGuideOpen(false);
    snoozeInstall();
  };

  if (mode === "continue") {
    return (
      <dialog open className="pwa-card" aria-labelledby="pwa-continue-title">
        <div className="pwa-card-head">
          <LogoMark className="pwa-card-logo" />
          <div>
            <h2 id="pwa-continue-title">Continue in the Gatepass app</h2>
            <p>
              Gatepass is installed on this device. The app opens full screen
              and keeps you signed in for visitor alerts.
            </p>
          </div>
        </div>
        {showContinueHelp && (
          <p className="pwa-help">{continueSteps(platform)}</p>
        )}
        <div className="pwa-actions">
          <button
            type="button"
            className="pwa-btn pwa-btn-ghost"
            onClick={dismissContinueInApp}
          >
            Stay in browser
          </button>
          {!showContinueHelp && (
            <button
              type="button"
              className="pwa-btn pwa-btn-primary"
              onClick={() => setShowContinueHelp(true)}
            >
              Open app
            </button>
          )}
        </div>
      </dialog>
    );
  }

  if (mode === "ios" && guideOpen) {
    const guide = iosSteps(platform);
    return (
      <ModalDialog
        className="pwa-sheet"
        aria-labelledby="pwa-guide-title"
        onClose={closeGuide}
      >
        <div className="pwa-sheet-body">
          <div className="pwa-sheet-grip" aria-hidden="true" />
          <div className="pwa-card-head">
            <LogoMark className="pwa-card-logo" />
            <div>
              <h2 id="pwa-guide-title">
                Install Gatepass on your {platform.device}
              </h2>
              <p>{guide.intro}</p>
            </div>
          </div>
          <ol className="pwa-steps">
            {guide.steps.map((step, index) => (
              <li key={step.id}>
                <span className="pwa-step-num">{index + 1}</span>
                <span className="pwa-step-icon">{step.icon}</span>
                <span className="pwa-step-text">{step.text}</span>
              </li>
            ))}
          </ol>
          {guide.showCopyLink && (
            <button
              type="button"
              className="pwa-btn pwa-btn-ghost pwa-btn-block"
              onClick={copyLink}
            >
              {copied ? "Link copied" : "Copy link"}
            </button>
          )}
          <div className="pwa-actions">
            <button
              type="button"
              className="pwa-btn pwa-btn-ghost"
              onClick={notNow}
            >
              Not now
            </button>
            <button
              type="button"
              className="pwa-btn pwa-btn-primary"
              onClick={gotIt}
            >
              Got it
            </button>
          </div>
        </div>
      </ModalDialog>
    );
  }

  let hint = null;
  if (mode === "manual") hint = manualHint(platform);
  else if (mode === "ios")
    hint =
      "Add it to your Home Screen for one-tap access, full screen, with visitor alerts.";

  return (
    <dialog open className="pwa-card" aria-labelledby="pwa-install-title">
      <div className="pwa-card-head">
        <LogoMark className="pwa-card-logo" />
        <div>
          <h2 id="pwa-install-title">Install the Gatepass app</h2>
          <p>
            {hint ||
              "Open Gatepass from your home screen or desktop, full screen, with visitor alerts."}
          </p>
        </div>
      </div>
      <div className="pwa-actions">
        <button
          type="button"
          className="pwa-btn pwa-btn-ghost"
          onClick={notNow}
        >
          Not now
        </button>
        {mode === "install" && (
          <button
            type="button"
            className="pwa-btn pwa-btn-primary"
            onClick={promptInstall}
          >
            Install
          </button>
        )}
        {mode === "ios" && (
          <button
            type="button"
            className="pwa-btn pwa-btn-primary"
            onClick={() => setGuideOpen(true)}
          >
            Show me how
          </button>
        )}
      </div>
    </dialog>
  );
}
