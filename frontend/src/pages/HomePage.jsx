import { useState } from "react";
import AppShell from "../components/visitor/AppShell";
import Card from "../components/visitor/ui/Card";
import BookingWizard from "../components/visitor/booking/BookingWizard";
import ReceptionBanner from "../components/visitor/booking/ReceptionBanner";
import OfficeStatus from "../components/visitor/booking/OfficeStatus";
import VisitPass from "../components/visitor/booking/VisitPass";
import { firstName } from "../components/visitor/booking/hosts";
import { isOfficeOpen } from "../components/visitor/booking/schedule";
import useBookingData from "../components/visitor/booking/useBookingData";
import useBookingFlow from "../components/visitor/booking/useBookingFlow";
import useNow from "../hooks/useNow";
import useReceptionMode from "../components/visitor/booking/useReceptionMode";
import useResetCountdown from "../components/visitor/booking/useResetCountdown";
import useToast from "../hooks/useToast";
import { loadVisitorDetails } from "../services/visitorDevice";

export default function HomePage() {
  const [receptionMode, turnOffReceptionMode] = useReceptionMode();
  const [returning] = useState(() =>
    receptionMode ? null : loadVisitorDetails(),
  );
  const { toast, showToast } = useToast();
  const data = useBookingData();
  const now = useNow();
  const flow = useBookingFlow({ receptionMode, data, now });
  const countdown = useResetCountdown(
    Boolean(flow.visit && receptionMode),
    flow.resetFlow,
  );
  const officeOpen = isOfficeOpen(now, data.hours);
  const greeting =
    returning && !receptionMode && flow.step === 0 && !flow.visit
      ? `Welcome back, ${firstName(returning.name)}`
      : null;

  const turnOffReception = () => {
    turnOffReceptionMode();
    showToast("Reception mode off");
  };

  return (
    <AppShell
      title={receptionMode ? "Reception desk" : "Book a visit"}
      hideTabs={receptionMode}
      action={<OfficeStatus open={officeOpen} />}
    >
      <Card id="check-in" ref={flow.flowRef} aria-labelledby="gp-flow-title">
        {receptionMode && <ReceptionBanner onTurnOff={turnOffReception} />}
        {flow.visit ? (
          <VisitPass
            visit={flow.visit}
            receptionMode={receptionMode}
            countdown={countdown}
            onDone={flow.resetFlow}
          />
        ) : (
          <BookingWizard
            flow={flow}
            data={data}
            receptionMode={receptionMode}
            officeOpen={officeOpen}
            greeting={greeting}
          />
        )}
      </Card>

      <output>
        {toast && (
          <span
            key={toast}
            className="fixed bottom-[max(24px,env(safe-area-inset-bottom))] left-1/2 z-60 w-max max-w-[calc(100vw-32px)] rounded-[14px] bg-ink px-[18px] py-3 text-[14px] text-white [box-shadow:0_20px_60px_rgba(26,23,20,0.14)] [transform:translateX(-50%)] motion-safe:animate-[gp-toast_0.3s_ease_both]"
          >
            {toast}
          </span>
        )}
      </output>
    </AppShell>
  );
}
