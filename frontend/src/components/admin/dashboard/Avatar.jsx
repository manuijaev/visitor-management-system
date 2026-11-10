import cn from "../../ui/cn";
import { getInitials } from "../utils";

const TONES = {
  gold: "bg-gold-light text-gold-dark",
  ink: "bg-ink text-white",
};

export default function Avatar({ name, tone = "gold", className }) {
  return (
    <span
      className={cn(
        "inline-flex size-[38px] shrink-0 items-center justify-center rounded-[12px] text-[13px] font-bold",
        TONES[tone],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
