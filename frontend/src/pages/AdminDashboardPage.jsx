import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { eatDateKey } from "../components/admin/utils";
import AdminToast from "../components/admin/dashboard/AdminToast";
import DashboardConfirm from "../components/admin/dashboard/DashboardConfirm";
import DashboardContent from "../components/admin/dashboard/DashboardContent";
import DashboardDialogs from "../components/admin/dashboard/DashboardDialogs";
import Sidebar from "../components/admin/dashboard/Sidebar";
import TabBar from "../components/admin/dashboard/TabBar";
import Topbar from "../components/admin/dashboard/Topbar";
import { PAGE_TITLES } from "../components/admin/dashboard/constants";
import {
  computeStats,
  downloadCsv,
  visitsToCsv,
} from "../components/admin/dashboard/helpers";
import useAdminData from "../components/admin/dashboard/useAdminData";
import useDashboardDialogs from "../components/admin/dashboard/useDashboardDialogs";
import useDashboardFilters from "../components/admin/dashboard/useDashboardFilters";
import useStaffActions from "../components/admin/dashboard/useStaffActions";
import useToast from "../hooks/useToast";

const DOT_PATTERN = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a39d96' fill-opacity='0.06'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [view, setView] = useState("overview");
  const [navOpen, setNavOpen] = useState(false);
  const { toast, showToast } = useToast();
  const closeNav = useCallback(() => setNavOpen(false), []);
  const notify = useCallback(
    (msg, type = "success") => showToast({ msg, type }),
    [showToast],
  );
  const data = useAdminData(notify);
  const filters = useDashboardFilters();
  const dialogs = useDashboardDialogs();
  const actions = useStaffActions({
    notify,
    loadData: data.loadData,
    openConfirm: dialogs.openConfirm,
    onInviteLink: dialogs.setInviteLink,
  });

  const { appointments, staff, departments } = data;
  const stats = useMemo(
    () => computeStats(appointments, staff),
    [appointments, staff],
  );

  const goTo = (next) => {
    setView(next);
    setNavOpen(false);
  };

  const showVisits = (status) => {
    filters.updateVisitFilters({ status });
    goTo("visitors");
  };

  const handleLogout = () => {
    sessionStorage.setItem("app_toast", "Logged out successfully.");
    logout();
    navigate("/staff");
  };

  const exportVisits = () => {
    if (!appointments.length) {
      notify("No visit requests to export.", "error");
      return;
    }
    downloadCsv(
      visitsToCsv(appointments),
      `visit_requests_${eatDateKey()}.csv`,
    );
  };

  const refresh = async () => {
    await data.loadData();
    notify("Up to date.");
  };

  return (
    <>
      <div
        data-console="admin"
        className="gp-root relative z-[1] grid min-h-screen grid-cols-[264px_minmax(0,1fr)] text-ink max-[1023px]:grid-cols-[minmax(0,1fr)] max-[760px]:pb-[calc(62px+env(safe-area-inset-bottom)+16px)]"
      >
        <Sidebar
          view={view}
          isOpen={navOpen}
          onClose={closeNav}
          counts={{
            pending: stats.pending,
            team: staff.length,
            departments: departments.length,
          }}
          onNavigate={goTo}
          onAddStaff={() => {
            setNavOpen(false);
            dialogs.openWizard();
          }}
        />
        <div
          className={
            navOpen
              ? "hidden max-[1023px]:fixed max-[1023px]:inset-0 max-[1023px]:z-[899] max-[1023px]:block max-[1023px]:bg-[rgba(26,23,20,0.42)]"
              : "hidden"
          }
          aria-hidden="true"
        />

        <div className="flex min-w-0 flex-col">
          <Topbar
            title={PAGE_TITLES[view]}
            user={user}
            appointments={appointments}
            onOpenNav={() => setNavOpen(true)}
            onOpenNotification={() => showVisits("all")}
            onRefresh={refresh}
            onSettings={() => goTo("settings")}
            onLogout={handleLogout}
          />

          <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-[22px] px-8 pt-[30px] pb-14 max-[1023px]:px-4 max-[1023px]:pt-[22px] max-[1023px]:pb-12">
            <DashboardContent
              view={view}
              user={user}
              data={data}
              stats={stats}
              filters={filters}
              notify={notify}
              actions={actions}
              dialogs={dialogs}
              onNavigate={goTo}
              onReviewPending={() => showVisits("pending")}
              onExport={exportVisits}
            />
          </main>

          <TabBar
            view={view}
            pending={stats.pending}
            navOpen={navOpen}
            onNavigate={goTo}
            onOpenNav={() => setNavOpen(true)}
          />
        </div>

        <AdminToast toast={toast} />
        <DashboardDialogs
          dialogs={dialogs}
          data={data}
          actions={actions}
          notify={notify}
        />
      </div>

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={DOT_PATTERN}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -top-[200px] -left-[200px] z-0 size-[700px] bg-[radial-gradient(circle,rgba(201,146,42,0.1)_0%,transparent_70%)] motion-safe:animate-[driftA_18s_ease-in-out_infinite_alternate]"
        aria-hidden="true"
      />

      <DashboardConfirm
        dialog={dialogs.confirmDialog}
        onConfirm={dialogs.runConfirm}
        onCancel={dialogs.closeConfirm}
      />
    </>
  );
}
