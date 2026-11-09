import { Link } from "react-router-dom";
import Icon from "../Icon";
import Button from "../ui/Button";
import Eyebrow from "../ui/Eyebrow";
import Ticket from "../ui/Ticket";
import TicketFoot from "./TicketFoot";
import { downloadCalendarInvite } from "./calendarInvite";
import { firstName, placement } from "./hosts";
import { passCopy } from "./visit";

const AUTO_NOTE = "mx-0 mb-0 mt-3 text-[12.5px] text-ink-faint";

export default function VisitPass({ visit, receptionMode, countdown, onDone }) {
  const copy = passCopy(visit);
  const later = visit.mode === "later";
  const items = [
    { label: "Visitor", value: visit.visitor.name.trim() },
    { label: "Seeing", value: visit.host.name },
    { label: "When", value: copy.when },
    { label: "Where", value: placement(visit.host) || "Reception" },
  ];

  return (
    <div className="px-(--gp-pad) pb-7 pt-[34px] text-center motion-safe:animate-[gp-step-in_0.4s_ease_both]">
      <span className="mx-auto mb-4 mt-0 grid size-[66px] place-items-center rounded-[50%] bg-green-light text-green motion-safe:animate-[gp-pop_0.55s_cubic-bezier(0.2,1.4,0.4,1)_both]">
        <Icon name="check" className="size-[30px] stroke-[2.4]" />
      </span>
      <Eyebrow>{later ? "Request sent" : "Host alerted"}</Eyebrow>
      <h2 className="mx-0 mb-2 mt-0 font-['Cormorant_Garamond',serif] text-[clamp(1.8rem,3vw,2.2rem)] font-semibold leading-[1.1]">
        {copy.headline}
      </h2>
      <p className="mx-auto my-0 max-w-[40ch] text-[14.5px] leading-[1.6] text-ink-light">
        {copy.body} We&apos;ll text{" "}
        <strong>{visit.visitor.phone.trim()}</strong> when they respond.
      </p>

      <Ticket items={items} className="mt-6">
        <TicketFoot
          status={`Waiting for ${firstName(visit.host.name)}`}
          reference={visit.reference}
        />
      </Ticket>

      <div className="mt-5 flex gap-2.5 max-[519px]:flex-col-reverse">
        {later && (
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => downloadCalendarInvite(visit)}
          >
            <Icon name="download" />
            Add to calendar
          </Button>
        )}
        <Button className="flex-1" onClick={onDone}>
          {receptionMode ? "Next visitor" : "Done"}
        </Button>
      </div>
      {receptionMode ? (
        <p className={AUTO_NOTE}>Starting a new check-in in {countdown}s</p>
      ) : (
        <p className={AUTO_NOTE}>
          It&apos;s saved in <Link to="/visits">My visits</Link>, where you can
          check or cancel it any time.
        </p>
      )}
    </div>
  );
}
