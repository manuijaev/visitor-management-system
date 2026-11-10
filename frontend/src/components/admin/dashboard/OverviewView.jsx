import Button from "../../ui/Button";
import Card, { CardHead } from "../Card";
import Icon from "../Icon";
import PageHead from "../PageHead";
import { EAT_TIMEZONE, firstName } from "../utils";
import { EMPTY_LINE, LINK_BUTTON, SERIF } from "../styles";
import OverviewStats from "./OverviewStats";
import PendingBanner from "./PendingBanner";
import PersonRow from "./PersonRow";
import VisitRow from "./VisitRow";
import { greeting, newestFirst } from "./helpers";
import { LIST_LAYOUTS } from "./rowStyles";

const todayLabel = () =>
  new Date().toLocaleDateString("en-GB", {
    timeZone: EAT_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

function ViewAllLink({ onClick, children }) {
  return (
    <button type="button" className={LINK_BUTTON} onClick={onClick}>
      {children} <Icon name="arrowRight" size={14} />
    </button>
  );
}

export default function OverviewView({
  user,
  data,
  stats,
  onNavigate,
  onReviewPending,
  onAddStaff,
}) {
  const { appointments, staff, departments, divisions, loaded } = data;
  const needsTeam = loaded && !staff.some((member) => member.role === "Staff");

  return (
    <>
      <PageHead
        title={
          <>
            {greeting()}, <em>{firstName(user?.full_name || "Admin")}</em>
          </>
        }
        subtitle={todayLabel()}
      />

      {stats.pending > 0 && (
        <PendingBanner
          pending={stats.pending}
          overdue={stats.overdue}
          onReview={onReviewPending}
        />
      )}

      <OverviewStats
        stats={stats}
        departments={departments}
        divisions={divisions}
      />

      {needsTeam && (
        <div className="flex items-center justify-between gap-6 rounded-[20px] bg-transparent bg-[linear-gradient(135deg,#1a1714_0%,#3d3832_100%)] px-7 py-[26px] text-chrome-text [box-shadow:var(--shadow-soft)] max-[760px]:flex-col max-[760px]:items-start">
          <div>
            <h2 className={`mt-0 mb-1.5 ${SERIF} text-[28px] text-white`}>
              Build your team
            </h2>
            <p className="m-0 max-w-[560px] text-[14px] leading-[1.55] text-chrome-muted">
              Add your first staff member. You can create their department and
              division in the same step, and they&apos;ll get an email to set up
              their account.
            </p>
          </div>
          <Button variant="accent" onClick={onAddStaff}>
            <Icon name="userPlus" size={15} />
            Add staff member
          </Button>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] [align-items:start] gap-5 max-[1100px]:grid-cols-[minmax(0,1fr)]">
        <Card>
          <CardHead title="Recent visit requests">
            <ViewAllLink onClick={() => onNavigate("visitors")}>
              View all
            </ViewAllLink>
          </CardHead>
          <div className={LIST_LAYOUTS.compact}>
            {appointments.slice(0, 5).map((visit) => (
              <VisitRow key={visit.id} visit={visit} layout="compact" />
            ))}
            {!appointments.length && (
              <div className={EMPTY_LINE}>No visit requests yet.</div>
            )}
          </div>
        </Card>
        <Card>
          <CardHead title="Team">
            <ViewAllLink onClick={() => onNavigate("team")}>Manage</ViewAllLink>
          </CardHead>
          <div className={LIST_LAYOUTS.compact}>
            {newestFirst(staff, 5).map((member) => (
              <PersonRow
                key={member.id}
                member={member}
                isSelf={member.id === user?.id}
                layout="compact"
              />
            ))}
          </div>
          <button
            type="button"
            className="mx-[22px] mt-0.5 mb-5 flex w-[calc(100%-44px)] items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-line-strong p-3 text-[13.5px] font-semibold text-ink-light hover:border-gold hover:bg-gold-light hover:text-gold-dark motion-safe:transition-[background-color,border-color,color] motion-safe:duration-150"
            onClick={onAddStaff}
          >
            <Icon name="plus" size={15} />
            Add staff member
          </button>
        </Card>
      </div>
    </>
  );
}
