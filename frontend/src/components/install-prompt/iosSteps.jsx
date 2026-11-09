import LogoMark from "../LogoMark";
import { AddSquareIcon, DotsIcon, ShareIcon } from "./icons";

const SHARE_STEP_BY_BROWSER = {
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
      Tap <strong>⋯</strong> at the bottom of Edge, then <strong>Share</strong>.
    </>
  ),
  firefox: (
    <>
      Tap the <strong>☰</strong> menu in Firefox, then <strong>Share</strong>.
    </>
  ),
};

const DEFAULT_SHARE_STEP = (
  <>
    Open your browser&apos;s menu and tap <strong>Share</strong>.
  </>
);

const OPEN_IN_SAFARI_STEPS = [
  {
    id: "open-in-safari",
    icon: <DotsIcon />,
    text: (
      <>
        Tap <strong>⋯</strong> or the compass icon and choose{" "}
        <strong>Open in Safari</strong>. You can also copy the link below and
        paste it into Safari.
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
];

const IN_APP_INTRO =
  "This page is open inside another app. Open it in Safari to add Gatepass to your Home Screen.";
const OLD_IOS_INTRO =
  "Your iOS version only allows adding apps from Safari. Open this page in Safari to continue.";
const INSTALL_INTRO =
  "Add Gatepass to your Home Screen for full-screen access and visitor alerts.";

function confirmStepText(iosVersion) {
  if (iosVersion >= 26) {
    return (
      <>
        Leave <strong>Open as Web App</strong> switched on and tap{" "}
        <strong>Add</strong>.
      </>
    );
  }
  return (
    <>
      Tap <strong>Add</strong> in the top-right corner.
    </>
  );
}

export function iosSteps({ browser, iosVersion, iosCanInstallHere }) {
  if (!iosCanInstallHere) {
    return {
      intro: browser === "inapp" ? IN_APP_INTRO : OLD_IOS_INTRO,
      steps: OPEN_IN_SAFARI_STEPS,
      showCopyLink: true,
    };
  }

  return {
    intro: INSTALL_INTRO,
    steps: [
      {
        id: "share",
        icon: <ShareIcon />,
        text: SHARE_STEP_BY_BROWSER[browser] || DEFAULT_SHARE_STEP,
      },
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
        icon: <span className="text-[14px] font-semibold">Add</span>,
        text: confirmStepText(iosVersion),
      },
      {
        id: "open-app",
        icon: <LogoMark className="size-[30px]" />,
        text: (
          <>
            Open <strong>Gatepass</strong> from your Home Screen and sign in.
            Visitor alerts on iPhone only work from the Home Screen app.
          </>
        ),
      },
    ],
    showCopyLink: false,
  };
}
