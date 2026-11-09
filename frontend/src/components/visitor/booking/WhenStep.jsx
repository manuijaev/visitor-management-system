import Icon from "../Icon";
import ChoiceChips from "./ChoiceChips";
import DayPicker from "./DayPicker";
import SlotPicker from "./SlotPicker";
import SubLabel from "./SubLabel";
import VisitModePicker from "./VisitModePicker";
import Note from "../ui/Note";
import { ETA_CHOICES } from "./constants";
import { formatDayLong, formatTime } from "./schedule";

const SUB =
  "mt-5 border-t [--tw-border-style:dashed] border-line-strong pt-[18px] motion-safe:animate-[gp-step-in_0.3s_ease_both]";

const etaLabel = (minutes) => `${minutes} min`;

export default function WhenStep({ flow, officeOpen, hoursSummary }) {
  const { mode, host, hostFirst, dayKey, slot } = flow;
  return (
    <>
      <VisitModePicker mode={mode} host={host} onSelect={flow.selectMode} />

      {host && !host.available && (
        <Note icon="info">
          {hostFirst} is away right now
          {host.reason ? `: ${host.reason}` : ""}. You can still plan a visit
          for later.
        </Note>
      )}
      {!officeOpen && mode && mode !== "later" && (
        <Note icon="clock" warn>
          The school office is closed right now (open {hoursSummary}). Staff may
          reply when they are back.
        </Note>
      )}

      {mode === "onway" && (
        <div className={SUB}>
          <SubLabel>Arriving in about</SubLabel>
          <ChoiceChips
            options={ETA_CHOICES}
            selected={flow.eta}
            onSelect={flow.setEta}
            renderLabel={etaLabel}
          />
        </div>
      )}

      {mode === "later" && (
        <div className={SUB}>
          <SubLabel>Pick a day</SubLabel>
          <DayPicker
            days={flow.days}
            dayKey={dayKey}
            host={host}
            hostFirst={hostFirst}
            onPick={flow.pickDay}
          />
          {dayKey && (
            <>
              <SubLabel spaced note="East Africa Time">
                Pick a time
              </SubLabel>
              <SlotPicker
                slots={flow.slots}
                slot={slot}
                host={host}
                hostFirst={hostFirst}
                onPick={flow.setSlot}
              />
            </>
          )}
          {flow.slotStillOpen && (
            <p className="mb-0 mt-4 flex items-center gap-2.5 rounded-[14px] bg-gold-light px-3.5 py-3 text-[14px] font-semibold text-gold-dark motion-safe:animate-[gp-step-in_0.25s_ease_both]">
              <Icon name="calendar" />
              {formatDayLong(slot)} at {formatTime(slot)}
            </p>
          )}
        </div>
      )}
    </>
  );
}
