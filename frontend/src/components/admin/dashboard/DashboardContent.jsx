import GateBoard from "../gate/GateBoard";
import OfficeHoursBoard from "../OfficeHoursBoard";
import DepartmentsView from "./DepartmentsView";
import OverviewView from "./OverviewView";
import SettingsView from "./SettingsView";
import TeamView from "./TeamView";
import VisitorsView from "./VisitorsView";

export default function DashboardContent({
  view,
  user,
  data,
  stats,
  filters,
  notify,
  actions,
  dialogs,
  onNavigate,
  onReviewPending,
  onExport,
}) {
  const { appointments, staff, departments, divisions, loadData } = data;
  switch (view) {
    case "overview":
      return (
        <OverviewView
          user={user}
          data={data}
          stats={stats}
          onNavigate={onNavigate}
          onReviewPending={onReviewPending}
          onAddStaff={() => dialogs.openWizard()}
        />
      );
    case "visitors":
      return (
        <VisitorsView
          appointments={appointments}
          filters={filters.visitFilters}
          onFiltersChange={filters.updateVisitFilters}
          layout={filters.layout}
          onLayoutChange={filters.setLayout}
          onExport={onExport}
          onReassign={dialogs.setReassignVisit}
          onDelete={actions.confirmDeleteVisit}
        />
      );
    case "gate":
      return (
        <GateBoard
          appointments={appointments}
          onChanged={loadData}
          notify={notify}
        />
      );
    case "hours":
      return <OfficeHoursBoard notify={notify} />;
    case "team":
      return (
        <TeamView
          user={user}
          staff={staff}
          departments={departments}
          filters={filters.peopleFilters}
          onFiltersChange={filters.updatePeopleFilters}
          layout={filters.layout}
          onLayoutChange={filters.setLayout}
          onAddStaff={dialogs.openWizard}
          onEdit={dialogs.setEditingMember}
          actions={actions}
        />
      );
    case "departments":
      return (
        <DepartmentsView
          departments={departments}
          divisions={divisions}
          staff={staff}
          onChange={loadData}
          notify={notify}
          confirm={dialogs.openConfirm}
          onAddStaff={dialogs.openWizard}
        />
      );
    case "settings":
      return (
        <SettingsView
          user={user}
          data={data}
          stats={stats}
          onNavigate={onNavigate}
          onExport={onExport}
        />
      );
    default:
      return null;
  }
}
