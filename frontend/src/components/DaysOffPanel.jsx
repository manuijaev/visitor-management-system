import { useEffect, useState } from "react";
import api from "../services/api";

const pad2 = (value) => String(value).padStart(2, "0");
const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};
const formatDay = (dateKey) =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const errorText = (error, fallback) => {
  const data = error?.response?.data;
  return data?.date?.[0] || data?.date || data?.detail || fallback;
};

export default function DaysOffPanel({ icon }) {
  const [days, setDays] = useState([]);
  const [newDay, setNewDay] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/staff/me/unavailable-days/")
      .then(
        ({ data }) => active && setDays((data || []).map((item) => item.date)),
      )
      .catch(
        () =>
          active &&
          setError("Couldn't load your days off. Refresh to try again."),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const addDay = async (event) => {
    event.preventDefault();
    if (!newDay || saving) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/staff/me/unavailable-days/", {
        date: newDay,
      });
      setDays((prev) =>
        [...new Set([...prev, data.date])].sort((a, b) => a.localeCompare(b)),
      );
      setNewDay("");
    } catch (err) {
      setError(errorText(err, "Couldn't save that day. Try again."));
    } finally {
      setSaving(false);
    }
  };

  const removeDay = async (day) => {
    setError("");
    try {
      await api.delete(`/staff/me/unavailable-days/${day}/`);
      setDays((prev) => prev.filter((item) => item !== day));
    } catch (err) {
      setError(errorText(err, "Couldn't remove that day. Try again."));
    }
  };

  const dayList =
    days.length === 0 ? (
      <div className="sd-empty">No days off planned.</div>
    ) : (
      <ul className="sd-days-off-list">
        {days.map((day) => (
          <li key={day}>
            <span>{formatDay(day)}</span>
            <button
              type="button"
              className="sd-btn sd-btn-view"
              onClick={() => removeDay(day)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="sd-panel sd-days-off">
      <div className="sd-panel-header">
        <h3>{icon} Days off</h3>
      </div>
      <p className="sd-days-off-intro">
        Visitors can&apos;t book you on these days.
      </p>

      <form className="sd-days-off-form" onSubmit={addDay}>
        <input
          type="date"
          min={todayKey()}
          value={newDay}
          onChange={(event) => setNewDay(event.target.value)}
          aria-label="Day off"
        />
        <button
          type="submit"
          className="sd-btn sd-btn-accept"
          disabled={!newDay || saving}
        >
          {saving ? "Saving…" : "Add day off"}
        </button>
      </form>

      {error && (
        <p className="sd-days-off-error" role="alert">
          {error}
        </p>
      )}

      {loading ? <div className="sd-empty">Loading…</div> : dayList}
    </div>
  );
}
