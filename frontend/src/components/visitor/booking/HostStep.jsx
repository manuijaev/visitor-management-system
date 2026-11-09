import Icon from "../Icon";
import DepartmentChips from "./DepartmentChips";
import HostOption from "./HostOption";
import TextInput from "../ui/TextInput";
import { listHosts } from "./hosts";

const SKELETON_KEYS = ["first", "second", "third"];

function emptyMessage(staffCount, query) {
  if (staffCount === 0) {
    return "No staff are listed yet. Please ask at the reception desk.";
  }
  return `No one matches "${query}". Try another name or department.`;
}

export default function HostStep({ flow, staff, departments, loading }) {
  const { search } = flow;
  const hosts = loading
    ? []
    : listHosts(staff, {
        department: search.department,
        query: search.query,
        blockFor: flow.blockFor,
      });

  return (
    <>
      <div className="relative mb-3">
        <Icon
          name="search"
          className="pointer-events-none absolute left-[15px] top-1/2 size-[18px] [transform:translateY(-50%)] text-ink-faint"
        />
        <TextInput
          className="pl-11 pr-[15px]"
          type="search"
          placeholder="Search name or department"
          value={search.query}
          onChange={(event) => search.setQuery(event.target.value)}
          aria-label="Search for a teacher or staff member"
        />
      </div>
      {departments.length > 1 && (
        <DepartmentChips
          departments={departments}
          value={search.department}
          onChange={search.setDepartment}
        />
      )}
      <div
        className="mr-[-4px] mt-3.5 grid max-h-[390px] grid-cols-[minmax(0,1fr)] gap-2 overflow-y-auto pr-1 max-[1099px]:max-h-none max-[1099px]:overflow-visible"
        role="radiogroup"
        aria-label="Teachers and staff"
      >
        {loading &&
          SKELETON_KEYS.map((key) => (
            <div
              key={key}
              className="h-[70px] rounded-[18px] bg-[linear-gradient(90deg,var(--color-surface-2)_0%,var(--color-bg)_50%,var(--color-surface-2)_100%)] [background-size:200%_100%] motion-safe:animate-[gp-shimmer_1.2s_linear_infinite]"
              aria-hidden="true"
            />
          ))}
        {hosts.map(({ member, block }) => (
          <HostOption
            key={member.id}
            member={member}
            block={block}
            selected={flow.hostId === member.id}
            mode={flow.mode}
            onPick={flow.pickHost}
          />
        ))}
        {!loading && hosts.length === 0 && (
          <div className="rounded-[18px] border-[1.5px] border-dashed border-line-strong px-[18px] py-7 text-center text-[14px] text-ink-light">
            {emptyMessage(staff.length, search.query)}
          </div>
        )}
      </div>
    </>
  );
}
