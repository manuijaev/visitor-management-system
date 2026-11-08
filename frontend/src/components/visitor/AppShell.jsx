import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import LogoMark from '../LogoMark';
import Icon from './Icon';
import '../../home.css';

const TABS = [
  { to: '/', label: 'Book', icon: 'calendar', match: (path) => path === '/' },
  { to: '/visits', label: 'My visits', icon: 'ticket', match: (path) => path === '/visits' || path === '/visit' },
  { to: '/help', label: 'Help', icon: 'help', match: (path) => path === '/help' },
];

/**
 * The visitor app frame: a slim top bar, the current screen, and a bottom tab bar.
 * `hideTabs` is used by reception mode, where the device is shared and stays on booking.
 */
export default function AppShell({ title, action, hideTabs = false, children }) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.body.classList.add('home-background');
    return () => document.body.classList.remove('home-background');
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={`gp-root gp-app ${hideTabs ? 'has-no-tabs' : ''}`}>
      <header className="gp-appbar">
        <div className="gp-appbar-inner">
          <NavLink to="/" className="gp-brand" aria-label="Gatepass, book a visit">
            <LogoMark className="gp-brand-mark" />
            <span>
              <strong>Gatepass</strong>
              <small>{title || 'School visits'}</small>
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
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={`gp-tab ${active ? 'is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon name={tab.icon} />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
