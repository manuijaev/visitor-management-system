import LogoMark from "./LogoMark";

export function hideBootSplash() {
  const boot = document.getElementById("boot");
  if (!boot) return;
  boot.classList.add("is-done");
  window.setTimeout(() => boot.remove(), 400);
}

export default function LogoLoader({ label = "Loading Gatepass" }) {
  return (
    <div className="boot">
      <output className="boot-status">{label}</output>
      <div className="boot-inner">
        <LogoMark animated className="boot-mark" />
        <span className="boot-word">Gatepass</span>
        <span className="boot-sub">Visitor desk</span>
        <span className="boot-bar" />
      </div>
    </div>
  );
}
