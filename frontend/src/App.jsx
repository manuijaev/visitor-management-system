import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LogoLoader, { hideBootSplash } from './components/LogoLoader';
import ErrorBoundary, { CHUNK_RELOAD_KEY } from './components/ErrorBoundary';
import InstallPrompt from './components/InstallPrompt';

// A tab left open across a deploy asks for chunk files that no longer exist; reload once to pick up the new build.
function lazyPage(load) {
  return lazy(() =>
    load().catch((error) => {
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) throw error;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      window.location.reload();
      return new Promise(() => {});
    })
  );
}

const StaffLoginPage = lazyPage(() => import('./pages/StaffLoginPage'));
const StaffDashboardPage = lazyPage(() => import('./pages/StaffDashboardPage'));
const AdminDashboardPage = lazyPage(() => import('./pages/AdminDashboardPage'));
const AdminSignupPage = lazyPage(() => import('./pages/AdminSignupPage'));
const VisitStatusPage = lazyPage(() => import('./pages/VisitStatusPage'));

function PageReady() {
  useEffect(() => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    hideBootSplash();
  }, []);
  return null;
}

function roleHomePath(user) {
  return user?.role === 'Admin' ? '/admin/dashboard' : '/staff/dashboard';
}

function ProtectedRoute({ children, roles, loginPath = '/staff/login' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={loginPath} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={roleHomePath(user)} replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isInviteLink = params.has('uid') && params.has('token');
  if (user && !isInviteLink) return <Navigate to={roleHomePath(user)} replace />;
  return children;
}

function HomeRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to={roleHomePath(user)} replace />;
  return <HomePage />;
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      <Navbar />
      <Suspense fallback={<LogoLoader />}>
        <PageReady />
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/visit" element={<VisitStatusPage />} />
          <Route
            path="/staff/login"
            element={
              <PublicOnlyRoute>
                <StaffLoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/admin/signup"
            element={
              <PublicOnlyRoute>
                <AdminSignupPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute roles={['Staff', 'Admin']}>
                <StaffDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['Admin']} loginPath="/staff/login">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <InstallPrompt />
    </ErrorBoundary>
  );
}
