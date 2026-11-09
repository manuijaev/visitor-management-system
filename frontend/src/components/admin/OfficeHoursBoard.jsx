import { useEffect, useState } from "react";
import api from "../../services/api";
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
      <div className="ad-empty-line">
        Could not load visiting hours. {loadError}
      </div>
    );
  if (!form)
    return <div className="ad-empty-line">Loading visiting hours…</div>;

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
      <div className="ad-page-head">
        <div>
          <h1>Visiting hours</h1>
          <p>
            Visitors can only plan visits inside these hours. Walk-ins can still
            check in at any time.
          </p>
        </div>
      </div>

      <form className="ad-card ad-hours-card" onSubmit={save}>
        <div className="ad-card-head">
          <h2>School office hours</h2>
          <span className="ad-hours-summary">{summary}</span>
        </div>

        <fieldset className="ad-field ad-fieldset">
          <legend>Open days</legend>
          <div className="ad-hours-days">
            {DAYS.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-pressed={form.open_days.includes(index)}
                className={`ad-hours-day ${form.open_days.includes(index) ? "is-on" : ""}`}
                onClick={() => toggleDay(index)}
              >
                {label}
              </button>
            ))}
          </div>
          {dayError && <small className="ad-hours-error">{dayError}</small>}
        </fieldset>

        <div className="ad-hours-times">
          <label className="ad-field">
            <span>Opens at</span>
            <input
              type="time"
              step="900"
              required
              value={form.opens_at}
              onChange={(event) =>
                setForm({ ...form, opens_at: event.target.value })
              }
            />
          </label>
          <label className="ad-field">
            <span>Closes at</span>
            <input
              type="time"
              step="900"
              required
              value={form.closes_at}
              onChange={(event) =>
                setForm({ ...form, closes_at: event.target.value })
              }
            />
          </label>
        </div>
        {timeError && <small className="ad-hours-error">{timeError}</small>}
        <small className="ad-muted-note">
          Visitors pick 30-minute slots starting from opening time. The last
          slot starts before closing time. Times are in East Africa Time.
        </small>

        <div className="ad-hours-actions">
          <button
            type="button"
            className="ad-btn ad-btn-ghost"
            disabled={!changed || saving}
            onClick={() => setForm(saved)}
          >
            Undo changes
          </button>
          <button
            type="submit"
            className="ad-btn ad-btn-primary"
            disabled={!canSave}
          >
            {saving ? "Saving…" : "Save hours"}
          </button>
        </div>
      </form>
    </>
  );
}
