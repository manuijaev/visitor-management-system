import Button from "../../ui/Button";
import Icon from "../Icon";

export default function SettingsButton({ icon, onClick, children }) {
  return (
    <Button
      variant="outline"
      className="max-[768px]:flex-[1_1_100%] max-[768px]:justify-center"
      onClick={onClick}
    >
      <Icon name={icon} size={15} />
      {children}
    </Button>
  );
}
