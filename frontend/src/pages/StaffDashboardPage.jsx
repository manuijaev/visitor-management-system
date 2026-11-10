import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OverdueAnnouncement from "../components/staff/OverdueAnnouncement";
import RequestPreviewModal from "../components/staff/RequestPreviewModal";
import StaffTabContent from "../components/staff/StaffTabContent";
import StaffSidebar from "../components/staff/StaffSidebar";
import StaffTabbar from "../components/staff/StaffTabbar";
import StaffTopbar from "../components/staff/StaffTopbar";
import StatusConfirmModal from "../components/staff/StatusConfirmModal";
import Toast from "../components/staff/Toast";
import { downloadRequestsCsv } from "../components/staff/csv";
import useAvailability from "../components/staff/useAvailability";
import useHomeBackground from "../components/staff/useHomeBackground";
import useStaffAppointments from "../components/staff/useStaffAppointments";
import useStaffNotifications from "../components/staff/useStaffNotifications";
import useStatusResponse from "../components/staff/useStatusResponse";
import useToast from "../hooks/useToast";
import {
  defaultRequestFilter,
  filterRequests,
  summarizeRequests,
} from "../components/staff/utils";

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast, showToast, clearToast } = useToast(4000);
  const { appointments, loadMyAppointments, updateAppointment, currentTime } =
    useStaffAppointments(() =>
      showToast("Session expired. Please log in again."),
    );
  const notifications = useStaffNotifications((message) =>
    showToast(message, 5000),
  );
  const availability = useAvailability(showToast);
  const response = useStatusResponse({
    appointments,
    updateAppointment,
    showToast,
  });
  useHomeBackground();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [requestFilter, setRequestFilter] = useState("all");
  const [todayOnly, setTodayOnly] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const [overdueDismissedKey, setOverdueDismissedKey] = useState("");

  const summary = useMemo(
    () => summarizeRequests(appointments, currentTime.getTime()),
    [appointments, currentTime],
  );
  const visibleRequests = filterRequests(appointments, {
    requestFilter,
    todayOnly,
    searchQuery,
  });
  const overdueKey = summary.overdue.map((visit) => visit.id).join(",");
  const showOverdue =
    activeTab === "dashboard" &&
    overdueKey &&
    overdueKey !== overdueDismissedKey;

  const goTo = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };
  const openRequests = (filter) => {
    setRequestFilter(filter);
    goTo("appointments");
  };
  const openDefaultRequests = () =>
    openRequests(defaultRequestFilter(summary.pending));

  const openOldestOverdue = () => {
    setPreviewItem(summary.overdue[0]);
    setOverdueDismissedKey(overdueKey);
  };

  const exportRequests = () => {
    const rows = visibleRequests.length > 0 ? visibleRequests : appointments;
    if (rows.length === 0) {
      showToast("No visit requests to export");
      return;
    }
    downloadRequestsCsv(rows);
    showToast("Visit requests exported to CSV");
  };

  const refresh = () =>
    void loadMyAppointments()
      .then(() => showToast("Refreshed!"))
      .catch(() => {});

  const handleLogout = () => {
    sessionStorage.setItem(
      "app_toast",
      `Goodbye, ${user?.full_name || "Staff"}! You have been logged out successfully.`,
    );
    logout();
    navigate("/staff");
  };

  return (
    <div className="flex min-h-screen bg-bg [--teal-dark:var(--gold-dark)] [--teal-light:var(--gold-light)] [--teal:var(--gold)]">
      <Toast message={toast} onClose={clearToast} />

      <StaffSidebar
        isOpen={sidebarOpen}
        activeTab={activeTab}
        pendingCount={summary.pending}
        onNavigate={goTo}
        onOpenRequests={openDefaultRequests}
        onExport={exportRequests}
        onClose={closeSidebar}
      />

      <main className="ml-[320px] flex flex-1 flex-col max-[992px]:ml-0 max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:pb-[calc(62px+env(safe-area-inset-bottom)+16px)]">
        <StaffTopbar
          activeTab={activeTab}
          currentTime={currentTime}
          user={user}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          availability={availability}
          notifications={notifications}
          onRefresh={refresh}
          onOpenSettings={() => setActiveTab("settings")}
          onLogout={handleLogout}
        />

        {showOverdue && (
          <OverdueAnnouncement
            overdue={summary.overdue}
            onOpen={openOldestOverdue}
          />
        )}

        <div className="flex-1 p-6 max-[768px]:p-4">
          <StaffTabContent
            activeTab={activeTab}
            summary={summary}
            appointments={appointments}
            user={user}
            onOpenPending={() => openRequests("pending")}
            onOpenVisit={setPreviewItem}
            requestsProps={{
              visits: visibleRequests,
              viewMode,
              response,
              searchQuery,
              onSearchChange: setSearchQuery,
              requestFilter,
              onFilterChange: setRequestFilter,
              todayOnly,
              onTodayOnlyChange: setTodayOnly,
              onViewModeChange: setViewMode,
              onExport: exportRequests,
            }}
          />
        </div>
      </main>

      <StaffTabbar
        activeTab={activeTab}
        pendingCount={summary.pending}
        isSidebarOpen={sidebarOpen}
        onNavigate={goTo}
        onOpenRequests={openDefaultRequests}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {previewItem && (
        <RequestPreviewModal
          visit={previewItem}
          response={response}
          onClose={() => setPreviewItem(null)}
        />
      )}

      <StatusConfirmModal response={response} />
    </div>
  );
}
