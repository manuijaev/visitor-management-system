import Button from "../../ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/DropdownMenu";
import Icon from "../Icon";

export default function RowMenu({ items }) {
  return (
    <div className="relative">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="icon-sm" aria-label="More actions">
            <Icon name="more" size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {items.filter(Boolean).map((item) => (
            <DropdownMenuItem
              key={item.label}
              tone={item.danger ? "danger" : undefined}
              onSelect={item.onClick}
            >
              <Icon name={item.icon} size={14} />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
