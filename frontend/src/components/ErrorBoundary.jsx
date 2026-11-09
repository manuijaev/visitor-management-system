import { Component } from "react";
import LogoMark from "./LogoMark";
import { hideBootSplash } from "./LogoLoader";
import {
  LOGIN_PATH,
  clearSession,
  expireSession,
  hasUsableSession,
  readStoredUser,
} from "../services/session";

export const CHUNK_RELOAD_KEY = "gp_chunk_reload";

function isChunkLoadError(error) {
  return /dynamically imported module|Importing a module script failed|Failed to fetch|ChunkLoadError/i.test(
    String(error?.message || error),
  );
}

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info?.componentStack);
    hideBootSplash();

    if (readStoredUser() && !hasUsableSession()) {
      expireSession();
      return;
    }
    if (isChunkLoadError(error) && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      window.location.reload();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  goToLogin = () => {
    clearSession();
    window.location.replace(LOGIN_PATH);
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="app-crash" role="alert">
        <div className="app-crash-card">
          <LogoMark className="app-crash-mark" />
          <h1>Something went wrong</h1>
          <p>
            This page couldn't load. Reload to try again, or log in again if the
            problem continues.
          </p>
          <div className="app-crash-actions">
            <button
              type="button"
              className="app-crash-primary"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
            <button
              type="button"
              className="app-crash-secondary"
              onClick={this.goToLogin}
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }
}
