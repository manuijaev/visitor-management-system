import DetailsStep from "./DetailsStep";
import HostStep from "./HostStep";
import ReviewStep from "./ReviewStep";
import WhenStep from "./WhenStep";

export default function BookingStep({ flow, data, receptionMode, officeOpen }) {
  switch (flow.step) {
    case 0:
      return (
        <WhenStep
          flow={flow}
          officeOpen={officeOpen}
          hoursSummary={data.hours.summary}
        />
      );
    case 1:
      return (
        <HostStep
          flow={flow}
          staff={data.staff}
          departments={data.departments}
          loading={data.loading}
        />
      );
    case 2:
      return (
        <DetailsStep
          details={flow.details}
          receptionMode={receptionMode}
          hostFirst={flow.hostFirst}
        />
      );
    default:
      return <ReviewStep flow={flow} receptionMode={receptionMode} />;
  }
}
