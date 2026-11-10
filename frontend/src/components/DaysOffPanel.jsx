import { useEffect, useState } from "react";
import api from "../services/api";
import Panel, { EmptyNote } from "./staff/Panel";
import Button from "./ui/Button";

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
      <EmptyNote>No days off planned.</EmptyNote>
    ) : (
      <ul className="m-0 list-none border-t border-line p-0">
        {days.map((day) => (
          <li
            key={day}
            className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-[14px] text-ink last:border-b-0"
          >
            <span>{formatDay(day)}</span>
            <Button variant="subtle" onClick={() => removeDay(day)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    );

  return (
    <Panel icon={icon} title="Days off">
      <p className="m-0 px-5 pt-4 pb-0 text-[13px] text-ink-faint">
        Visitors can&apos;t book you on these days.
      </p>

      <form className="flex flex-wrap gap-2.5 px-5 pt-3 pb-4" onSubmit={addDay}>
        <input
          type="date"
          className="flex-[1_1_180px] rounded-lg border border-line bg-surface p-2.5 text-[13px] text-ink focus:border-gold focus:outline-none"
          min={todayKey()}
          value={newDay}
          onChange={(event) => setNewDay(event.target.value)}
          aria-label="Day off"
        />
        <Button type="submit" variant="accept" disabled={!newDay || saving}>
          {saving ? "Saving…" : "Add day off"}
        </Button>
      </form>

      {error && (
        <p className="m-0 px-5 pb-3 text-[13px] text-(--red-dark)" role="alert">
          {error}
        </p>
      )}

      {loading ? <EmptyNote>Loading…</EmptyNote> : dayList}
    </Panel>
  );
}
