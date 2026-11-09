import PageHead from "../PageHead";
import { getInitials } from "../utils";
import AccountList from "./AccountList";
import SettingsButton from "./SettingsButton";
import SettingsCard from "./SettingsCard";

const ACTIONS = "mx-[22px] mt-4 flex flex-wrap gap-2.5";

export default function SettingsView({
  user,
  data,
  stats,
  onNavigate,
  onExport,
}) {
  const { departments, divisions, appointments } = data;
  return (
    <>
      <PageHead
        title="Settings"
        subtitle="Your account and the school's setup."
      />
      <div className="grid max-w-[720px] gap-4 *:min-w-0">
        <SettingsCard title="Your account">
          <div className="mx-[22px] flex items-center gap-3.5 border-b border-line pt-2.5 pb-[18px]">
            <span className="grid size-[52px] flex-none place-items-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[14px] bg-gold-strong text-[16px] font-semibold text-white">
              {getInitials(user?.full_name || "Admin")}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <strong className="text-[17px] text-ink">
                {user?.full_name || "Administrator"}
              </strong>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] text-ink-light">
                {user?.email}
              </span>
            </div>
          </div>
          <AccountList rows={[["Role", "Administrator"]]} />
        </SettingsCard>

        <SettingsCard title="School setup">
          <AccountList
            rows={[
              [
                "Departments",
                `${departments.length} departments · ${divisions.length} divisions`,
              ],
              [
                "Staff",
                `${stats.active} active${stats.invited ? ` · ${stats.invited} invited` : ""}`,
              ],
            ]}
          />
          <div className={ACTIONS}>
            <SettingsButton icon="team" onClick={() => onNavigate("team")}>
              Manage team
            </SettingsButton>
            <SettingsButton
              icon="building"
              onClick={() => onNavigate("departments")}
            >
              Manage departments
            </SettingsButton>
          </div>
        </SettingsCard>

        <SettingsCard title="Visit records">
          <AccountList
            rows={[
              ["Visit requests", `${appointments.length} in total`],
              ["Console refresh", "Every 15 seconds"],
            ]}
          />
          <div className={ACTIONS}>
            <SettingsButton icon="download" onClick={onExport}>
              Export all visits (CSV)
            </SettingsButton>
          </div>
        </SettingsCard>
      </div>
    </>
  );
}
