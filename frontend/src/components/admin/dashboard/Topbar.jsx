import { useState } from "react";
import Button from "../../ui/Button";
import Icon from "../Icon";
import { SERIF } from "../styles";
import AdminNotifications from "./AdminNotifications";
import ProfileMenu from "./ProfileMenu";
import TopbarClock from "./TopbarClock";

export default function Topbar({
  title,
  user,
  appointments,
  onOpenNav,
  onOpenNotification,
  onRefresh,
  onSettings,
  onLogout,
}) {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-[rgba(249,247,244,0.86)] px-8 backdrop-blur-[12px] max-[1023px]:px-4 max-[768px]:bg-surface max-[768px]:backdrop-filter-none">
      <Button
        variant="icon"
        className="min-[1024px]:hidden max-[760px]:hidden"
        onClick={onOpenNav}
        aria-label="Open menu"
      >
        <Icon name="menu" size={18} />
      </Button>
      <div
        className={`hidden ${SERIF} text-[22px] font-bold max-[1023px]:inline-flex`}
      >
        {title}
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <TopbarClock />
        <AdminNotifications
          appointments={appointments}
          onOpenItem={onOpenNotification}
        />
        <Button
          variant="icon"
          className="max-[400px]:hidden"
          disabled={refreshing}
          aria-label="Refresh"
          title="Refresh"
          onClick={refresh}
        >
          <Icon name="refresh" size={16} />
        </Button>
        <ProfileMenu user={user} onSettings={onSettings} onLogout={onLogout} />
      </div>
    </header>
  );
}
