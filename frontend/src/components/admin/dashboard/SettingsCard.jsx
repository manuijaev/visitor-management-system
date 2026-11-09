import Card, { CardHead } from "../Card";

export default function SettingsCard({ title, children }) {
  return (
    <Card className="pb-5">
      <CardHead title={title} />
      {children}
    </Card>
  );
}
