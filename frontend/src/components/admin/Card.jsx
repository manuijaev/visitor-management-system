import cn from "../ui/cn";
import { CARD, CARD_HEAD, CARD_TITLE } from "./styles";

export function CardHead({ as: Tag = "header", title, children }) {
  return (
    <Tag className={CARD_HEAD}>
      <h2 className={CARD_TITLE}>{title}</h2>
      {children}
    </Tag>
  );
}

export default function Card({ as: Tag = "section", className, ...props }) {
  return <Tag className={cn(CARD, className)} {...props} />;
}
