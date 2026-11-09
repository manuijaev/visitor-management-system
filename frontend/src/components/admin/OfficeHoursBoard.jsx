import { useEffect, useState } from "react";
import api from "../../services/api";
import Button from "../ui/Button";
import Card, { CardHead } from "./Card";
import Field from "./Field";
import PageHead from "./PageHead";
import { EMPTY_LINE, FIELD, FIELD_LABEL, INPUT, NOTE } from "./styles";
import { formatApiError } from "./utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const toInputTime = (value) => String(value || "").slice(0, 5);

export default function OfficeHoursBoard({ notify }) {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const applyServerHours = (data) => {
    const next = {
      opens_at: toInputTime(data.opens_at),
      closes_at: toInputTime(data.closes_at),
      open_days: data.open_days,
    };
    setForm(next);
    setSaved(next);
    setSummary(data.summary);
  };

  useEffect(() => {
    api
      .get("/office-hours/")
      .then(({ data }) => applyServerHours(data))
      .catch((err) => setLoadError(formatApiError(err)));
  }, []);

  if (loadError)
    return (
      <div className={EMPTY_LINE}>
        Could not load visiting hours. {loadError}
      </div>
    );
  if (!form) return <div className={EMPTY_LINE}>Loading visiting hours…</div>;

  const toggleDay = (index) =>
    setForm((current) => ({
      ...current,
      open_days: current.open_days.includes(index)
        ? current.open_days.filter((day) => day !== index)
        : [...current.open_days, index].sort((a, b) => a - b),
    }));

  const timeError =
    form.opens_at && form.closes_at && form.closes_at <= form.opens_at
      ? "Closing time must be after opening time."
      : "";
  const dayError = form.open_days.length ? "" : "Pick at least one day.";
  const changed = JSON.stringify(form) !== JSON.stringify(saved);
  const canSave =
    changed &&
    !timeError &&
    !dayError &&
    form.opens_at &&
    form.closes_at &&
    !saving;

  const save = async (event) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const { data } = await api.patch("/office-hours/", form);
      applyServerHours(data);
      notify(`Visiting hours saved: ${data.summary}`);
    } catch (err) {
      notify(formatApiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead
        title="Visiting hours"
        subtitle="Visitors can only plan visits inside these hours. Walk-ins can still check in at any time."
      />

      <Card
        as="form"
        className="flex max-w-[640px] flex-col gap-[18px]"
        onSubmit={save}
      >
        <CardHead as="div" title="School office hours">
          <span className="text-[13px] text-ink-light">{summary}</span>
        </CardHead>

        <fieldset className={`${FIELD} m-0 min-w-0 p-0 [border:none]`}>
          <legend className={`${FIELD_LABEL} mb-[7px] p-0`}>Open days</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-pressed={form.open_days.includes(index)}
                className={`min-w-14 rounded-[11px] border-[1.5px] px-3 py-[9px] text-[13.5px] font-semibold max-[520px]:min-w-0 max-[520px]:flex-[1_0_calc(25%-8px)] motion-safe:transition-[background,border-color,color] motion-safe:duration-150 ${form.open_days.includes(index) ? "border-gold bg-gold-light text-gold-dark" : "border-line bg-surface-2 text-ink-light"}`}
                onClick={() => toggleDay(index)}
              >
                {label}
              </button>
            ))}
          </div>
          {dayError && <small className={NOTE}>{dayError}</small>}
        </fieldset>

        <div className="grid grid-cols-2 gap-3.5 max-[520px]:grid-cols-1">
          <Field label="Opens at">
            <input
              className={INPUT}
              type="time"
              step="900"
              required
              value={form.opens_at}
              onChange={(event) =>
                setForm({ ...form, opens_at: event.target.value })
              }
            />
          </Field>
          <Field label="Closes at">
            <input
              className={INPUT}
              type="time"
              step="900"
              required
              value={form.closes_at}
              onChange={(event) =>
                setForm({ ...form, closes_at: event.target.value })
              }
            />
          </Field>
        </div>
        {timeError && (
          <small className="text-[12.5px] text-red">{timeError}</small>
        )}
        <small className={NOTE}>
          Visitors pick 30-minute slots starting from opening time. The last
          slot starts before closing time. Times are in East Africa Time.
        </small>

        <div className="flex flex-wrap justify-end gap-2.5">
          <Button
            variant="outline"
            disabled={!changed || saving}
            onClick={() => setForm(saved)}
          >
            Undo changes
          </Button>
          <Button type="submit" variant="solid" disabled={!canSave}>
            {saving ? "Saving…" : "Save hours"}
          </Button>
        </div>
      </Card>
    </>
  );
}
