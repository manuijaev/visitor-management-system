import { useState } from "react";
import api from "../../../services/api";
import Card from "../Card";
import PageHead from "../PageHead";
import SegmentedTabs from "../dashboard/SegmentedTabs";
import { EMPTY_LINE, TOOLBAR } from "../styles";
import SearchField from "../dashboard/SearchField";
import { formatApiError } from "../utils";
import GateRow from "./GateRow";
import GateStats from "./GateStats";
import { GATE_TABS, gateActionMessage, groupGateVisits } from "./gateVisits";

export default function GateBoard({ appointments, onChanged, notify }) {
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState(null);

  const groups = groupGateVisits(appointments, query);
  const activeTab = tab || (groups.onsite.length ? "onsite" : "expected");
  const current = GATE_TABS.find((item) => item.id === activeTab);
  const visits = groups[activeTab];

  const act = async (visit, action) => {
    setBusyId(visit.id);
    try {
      await api.post(`/appointments/${visit.id}/${action}/`);
      notify(gateActionMessage(visit, action));
      await onChanged();
    } catch (err) {
      notify(formatApiError(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHead
        title="Arrivals"
        subtitle="Today's visitors. Mark them as arrived when they reach reception (their host gets a text) and as left when they go."
      />

      <GateStats groups={groups} onSelect={setTab} />

      <Card>
        <div className={TOOLBAR}>
          <SegmentedTabs
            label="Arrivals list"
            tabs={GATE_TABS.map((item) => ({
              id: item.id,
              label: item.label,
              count: groups[item.id].length,
            }))}
            value={activeTab}
            onChange={setTab}
          />
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Find a visitor or host"
          />
        </div>
        <div className="mt-2 px-2.5 pt-1.5 pb-3">
          {visits.map((visit) => (
            <GateRow
              key={visit.id}
              visit={visit}
              tab={current}
              busy={busyId === visit.id}
              onAction={act}
            />
          ))}
          {!visits.length && <div className={EMPTY_LINE}>{current.empty}</div>}
        </div>
      </Card>
    </>
  );
}
