import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import LogoMark from "../LogoMark";
import Icon from "./Icon";

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

const WITH_TABS =
  "[--gp-foot-bottom:calc(62px+env(safe-area-inset-bottom))] [--gp-foot-pb:16px] [--gp-main-pb:calc(62px+env(safe-area-inset-bottom)+28px)]";
const NO_TABS =
  "[--gp-foot-bottom:0px] [--gp-foot-pb:max(24px,env(safe-area-inset-bottom))] [--gp-main-pb:calc(env(safe-area-inset-bottom)+24px)]";

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
    <div
      className={`gp-root relative z-[1] min-h-dvh font-['Outfit',sans-serif] text-ink [-webkit-tap-highlight-color:transparent] [--gp-pad:28px] max-[759px]:[--gp-pad:18px] ${hideTabs ? NO_TABS : WITH_TABS}`}
    >
      <header className="sticky top-0 z-40 border-b border-[rgba(232,226,217,0.9)] bg-[rgba(249,247,244,0.88)] pt-[env(safe-area-inset-top)] backdrop-blur-[14px] backdrop-saturate-[1.4]">
        <div
          className={`mx-auto flex h-[60px] max-w-[640px] items-center gap-3 px-4 ${back ? "justify-start" : "justify-between"}`}
        >
          {back && (
            <Link
              to={back.to}
              className="-ml-2 grid size-10 flex-none place-items-center rounded-xl text-ink hover:bg-[rgba(0,0,0,0.05)]"
              aria-label={back.label}
            >
              <Icon name="chevronLeft" className="size-[22px]" />
            </Link>
          )}
          <NavLink
            to="/"
            className="group flex items-center gap-2.5 text-ink no-underline"
            aria-label="Gatepass, book a visit"
          >
            <LogoMark className="size-[34px] flex-none group-hover:[transform:rotate(-6deg)_scale(1.05)] motion-safe:[transition:transform_0.25s_ease]" />
            <span>
              <strong className="block font-['Cormorant_Garamond',serif] text-[21px] font-bold leading-none">
                Gatepass
              </strong>
              <small className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                {title || "School visits"}
              </small>
            </span>
          </NavLink>
          {action && <div className={back ? "ml-auto" : ""}>{action}</div>}
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-4 pb-(--gp-main-pb) pt-4 min-[760px]:pt-7">
        {children}
      </main>

      {!hideTabs && (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-[rgba(255,255,255,0.94)] pb-[env(safe-area-inset-bottom)] backdrop-blur-[14px] backdrop-saturate-[1.4]"
          aria-label="Main"
          data-gp-tabbar=""
        >
          <div className="mx-auto grid h-[62px] max-w-[640px] grid-cols-[repeat(3,minmax(0,1fr))]">
            {TABS.map((tab) => {
              const active = tab.match(pathname);
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className={`flex flex-col items-center justify-center gap-1 text-[11.5px] font-semibold no-underline motion-safe:[transition:color_0.15s_ease] ${active ? "text-ink" : "text-ink-faint"}`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    name={tab.icon}
                    className={`size-[23px] ${active ? "text-gold" : ""}`}
                  />
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
