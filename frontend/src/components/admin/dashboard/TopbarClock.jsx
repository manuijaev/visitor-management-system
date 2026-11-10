import { formatTopbarDateTime } from "../utils";
import { REFRESH_INTERVAL_MS } from "./constants";
import useNow from "../../../hooks/useNow";

export default function TopbarClock() {
  const now = useNow(REFRESH_INTERVAL_MS);
  return (
    <span className="mr-1.5 whitespace-nowrap text-[13px] text-ink-mid lining-nums tabular-nums max-[900px]:hidden">
      {formatTopbarDateTime(now)}
    </span>
  );
}
