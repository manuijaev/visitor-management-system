import { useCallback, useState } from "react";

const initialLayout = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(max-width: 768px)").matches
    ? "grid"
    : "list";

export default function useDashboardFilters() {
  const [visitFilters, setVisitFilters] = useState({
    search: "",
    status: "all",
  });
  const [peopleFilters, setPeopleFilters] = useState({
    search: "",
    departmentId: "",
  });
  const [layout, setLayout] = useState(initialLayout);

  const updateVisitFilters = useCallback(
    (changes) => setVisitFilters((current) => ({ ...current, ...changes })),
    [],
  );
  const updatePeopleFilters = useCallback(
    (changes) => setPeopleFilters((current) => ({ ...current, ...changes })),
    [],
  );

  return {
    visitFilters,
    updateVisitFilters,
    peopleFilters,
    updatePeopleFilters,
    layout,
    setLayout,
  };
}
