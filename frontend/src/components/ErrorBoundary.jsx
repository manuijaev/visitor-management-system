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

const CRASH_BUTTON =
  "min-h-11 w-full cursor-pointer rounded-[999px] px-[22px] py-0 font-sans text-[14px] leading-none font-semibold [box-shadow:var(--shadow-soft)] hover:-translate-y-px motion-safe:transition-[transform,background] motion-safe:duration-150";

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
      <div
        className="fixed inset-0 z-[9998] grid place-items-center bg-[radial-gradient(circle_at_50%_40%,#fdf3e3_0%,#f9f7f4_46%)] p-6 font-sans text-ink"
        role="alert"
      >
        <div className="flex w-[min(420px,100%)] flex-col items-center text-center">
          <LogoMark className="size-16 drop-shadow-[0_16px_26px_rgba(26,23,20,0.24)]" />
          <h1 className="mt-[22px] mb-2 font-serif text-[30px] leading-[1.1] font-semibold tracking-[-0.01em] text-ink">
            Something went wrong
          </h1>
          <p className="m-0 text-[15px] leading-[1.55] text-[#6b645c]">
            This page couldn't load. Reload to try again, or log in again if the
            problem continues.
          </p>
          <div className="mt-[26px] flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              className={`${CRASH_BUTTON} border-none bg-ink text-bg hover:bg-gold-dark`}
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
            <button
              type="button"
              className={`${CRASH_BUTTON} border border-[#d9d1c5] bg-white text-ink hover:border-ink`}
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
