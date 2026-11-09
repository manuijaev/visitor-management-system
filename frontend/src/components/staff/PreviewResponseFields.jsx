import { toLocalInputValue } from "./utils";

const INPUT =
  "min-h-[72px] w-full resize-y rounded-[10px] border border-line bg-surface p-2.5 text-[14px] text-ink";

export function PreviewSection({ title, children }) {
  return (
    <div className="mt-3 rounded-xl bg-surface-2 p-4 text-left">
      <h5 className="mt-0 mb-2 text-[13px] font-semibold tracking-[0.5px] text-ink-mid uppercase">
        {title}
      </h5>
      {children}
    </div>
  );
}

export default function PreviewResponseFields({ visit, response }) {
  return (
    <>
      <PreviewSection title={<>New date &amp; time (to reschedule)</>}>
        <input
          type="datetime-local"
          className={INPUT}
          min={toLocalInputValue(new Date())}
          value={response.rescheduleTo[visit.id] || ""}
          onChange={(e) => response.setRescheduleTime(visit.id, e.target.value)}
        />
      </PreviewSection>
      <PreviewSection title="Response note (optional)">
        <textarea
          className={INPUT}
          placeholder="Add a brief response note (optional)..."
          value={response.notes[visit.id] || ""}
          onChange={(e) => response.setNote(visit.id, e.target.value)}
          rows="3"
        />
      </PreviewSection>
    </>
  );
}
