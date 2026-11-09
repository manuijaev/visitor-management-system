import Button from "../ui/Button";
import { INPUT_SKIN } from "./styles";

export default function CopyField({ value, label, onCopy, children }) {
  return (
    <div className="mt-2 flex w-full gap-2">
      <input
        readOnly
        className={`${INPUT_SKIN} w-full min-w-0 flex-1 px-3.5 py-[11px] font-['JetBrains_Mono',ui-monospace,monospace] text-[12px] text-ink-mid`}
        value={value}
        onFocus={(event) => event.target.select()}
        aria-label={label}
      />
      <Button variant="outline" onClick={onCopy}>
        {children}
      </Button>
    </div>
  );
}
