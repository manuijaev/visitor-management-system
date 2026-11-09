import { useCallback, useState } from "react";
import { ALL_DEPARTMENTS } from "./constants";

export default function useHostSearch() {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState(ALL_DEPARTMENTS);

  const resetSearch = useCallback(() => {
    setQuery("");
    setDepartment(ALL_DEPARTMENTS);
  }, []);

  return { query, setQuery, department, setDepartment, resetSearch };
}
