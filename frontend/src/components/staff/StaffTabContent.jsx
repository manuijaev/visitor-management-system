import HomeTab from "./HomeTab";
import RequestsTab from "./RequestsTab";
import ScheduleTab from "./ScheduleTab";
import SettingsTab from "./SettingsTab";
import { recentRequests } from "./utils";

export default function StaffTabContent({
  activeTab,
  summary,
  appointments,
  user,
  onOpenPending,
  onOpenVisit,
  requestsProps,
}) {
  if (activeTab === "dashboard") {
    return (
      <HomeTab
        summary={summary}
        recent={recentRequests(appointments)}
        onOpenPending={onOpenPending}
        onOpenVisit={onOpenVisit}
      />
    );
  }
  if (activeTab === "appointments") {
    return (
      <RequestsTab
        appointments={appointments}
        onOpenVisit={onOpenVisit}
        {...requestsProps}
      />
    );
  }
  if (activeTab === "schedule") return <ScheduleTab todays={summary.todays} />;
  if (activeTab === "settings") return <SettingsTab user={user} />;
  return null;
}
