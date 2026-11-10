import cn from "../ui/cn";
import { FIELD, FIELD_LABEL } from "./styles";

export default function Field({
  as: Tag = "label",
  label,
  className,
  children,
}) {
  return (
    <Tag className={cn(FIELD, className)}>
      <span className={FIELD_LABEL}>{label}</span>
      {children}
    </Tag>
  );
}
