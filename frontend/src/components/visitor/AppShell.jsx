import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import LogoMark from "../LogoMark";
import Icon from "./Icon";
import "../../home.css";

const TABS = [
  { to: "/", label: "Book", icon: "calendar", match: (path) => path === "/" },
  {
    to: "/visits",
    label: "My visits",
    icon: "ticket",
    match: (path) => path === "/visits" || path === "/visit",
  },
  {
    to: "/help",
    label: "Help",
    icon: "help",
    match: (path) => path === "/help",
  },
];

export default function AppShell({
  title,
  action,
  back,
  hideTabs = false,
  children,
}) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.body.classList.add("home-background");
    return () => document.body.classList.remove("home-background");
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={`gp-root gp-app ${hideTabs ? "has-no-tabs" : ""}`}>
      <header className="gp-appbar">
        <div className={`gp-appbar-inner ${back ? "has-back" : ""}`}>
          {back && (
            <Link to={back.to} className="gp-back" aria-label={back.label}>
              <Icon name="chevronLeft" />
            </Link>
          )}
          <NavLink
            to="/"
            className="gp-brand"
            aria-label="Gatepass, book a visit"
          >
            <LogoMark className="gp-brand-mark" />
            <span>
              <strong>Gatepass</strong>
              <small>{title || "School visits"}</small>
            </span>
          </NavLink>
          {action && <div className="gp-appbar-action">{action}</div>}
        </div>
      </header>

      <main className="gp-app-main">{children}</main>

      {!hideTabs && (
        <nav className="gp-tabbar" aria-label="Main">
          <div className="gp-tabbar-inner">
            {TABS.map((tab) => {
              const active = tab.match(pathname);
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`gp-tab ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon name={tab.icon} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
