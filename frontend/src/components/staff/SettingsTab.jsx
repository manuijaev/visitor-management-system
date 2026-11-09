import Panel from "./Panel";
import { ICONS } from "./icons";
import { getInitials } from "./utils";

const ROW =
  "flex items-baseline justify-between gap-4 border-b border-line py-3.5 max-[480px]:flex-col max-[480px]:gap-0.5";
const TERM = "text-[14px] text-ink-light";
const VALUE =
  "m-0 text-right text-[14px] font-medium text-ink max-[480px]:text-left";

export default function SettingsTab({ user }) {
  return (
    <div>
      <Panel
        icon={ICONS.settings}
        title="Settings"
        className="mx-auto w-full max-w-[640px]"
      >
        <div className="p-5">
          <div className="flex items-center gap-3.5 border-b border-line pt-1 pb-[18px]">
            <span className="grid size-[52px] overflow-hidden text-ellipsis whitespace-nowrap flex-none place-items-center rounded-[14px] bg-gold-strong text-[16px] font-semibold text-white">
              {getInitials(user?.full_name)}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <strong className="text-[17px] text-ink">
                {user?.full_name || "Staff member"}
              </strong>
              <span className="overflow-hidden text-[14px] text-ellipsis whitespace-nowrap text-ink-light">
                {user?.email}
              </span>
            </div>
          </div>
          <dl className="m-0">
            <div className={ROW}>
              <dt className={TERM}>Department</dt>
              <dd className={VALUE}>
                {user?.department_name || "Not assigned"}
              </dd>
            </div>
            <div className={ROW}>
              <dt className={TERM}>Division</dt>
              <dd className={VALUE}>{user?.division_name || "Not assigned"}</dd>
            </div>
            <div className={ROW}>
              <dt className={TERM}>Visitor requests</dt>
              <dd className={VALUE}>Refresh automatically every 15 seconds</dd>
            </div>
          </dl>
          <p className="mt-3.5 mb-0 text-[13px] text-ink-faint">
            To change your name, email or department, ask the school admin.
          </p>
        </div>
      </Panel>
    </div>
  );
}
