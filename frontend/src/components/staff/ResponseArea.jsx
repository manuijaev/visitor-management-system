import Button from "../ui/Button";
import { rescheduleTimeError, toLocalInputValue } from "./utils";

const FIELD =
  "w-full rounded-lg border border-line bg-surface p-2.5 text-[13px] text-ink focus:border-gold focus:outline-none";

export default function ResponseArea({ visit, response }) {
  const action = response.actions[visit.id];
  const rescheduleValue = response.rescheduleTo[visit.id];
  const isReschedule = action === "Rescheduled";

  return (
    <div className="border-t border-line bg-surface-2 p-4 max-[480px]:p-3">
      {isReschedule && (
        <label className="mb-2.5 flex flex-col gap-1.5 text-[12px] font-semibold text-ink">
          <span>New date &amp; time</span>
          <input
            type="datetime-local"
            className={FIELD}
            min={toLocalInputValue(new Date())}
            value={rescheduleValue || ""}
            onChange={(e) =>
              response.setRescheduleTime(visit.id, e.target.value)
            }
          />
        </label>
      )}
      <textarea
        className={`${FIELD} mb-2.5 resize-none`}
        placeholder="Add a response note (optional)..."
        value={response.notes[visit.id] || ""}
        onChange={(e) => response.setNote(visit.id, e.target.value)}
        rows="2"
      />
      <div className="flex gap-2 max-[480px]:flex-col">
        <Button
          variant="accept"
          className="max-[480px]:justify-center"
          disabled={
            isReschedule && Boolean(rescheduleTimeError(rescheduleValue, visit))
          }
          onClick={() =>
            response.requestStatusUpdate(
              visit.id,
              visit.visitor_name,
              action || "Accepted",
            )
          }
        >
          Send & {action || "Accept"}
        </Button>
        <Button
          variant="subtle"
          className="max-[480px]:justify-center"
          onClick={() => response.closeResponseArea(visit.id)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
