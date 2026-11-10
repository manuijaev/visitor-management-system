import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useToast from "./useToast";

describe("useToast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows a toast and hides it after the default duration", () => {
    const { result } = renderHook(() => useToast(1000));
    act(() => result.current.showToast("Saved"));
    expect(result.current.toast).toBe("Saved");
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.toast).toBeNull();
  });

  it("keeps a newer toast visible when an older timer would have fired", () => {
    const { result } = renderHook(() => useToast(1000));
    act(() => result.current.showToast("First"));
    act(() => vi.advanceTimersByTime(800));
    act(() => result.current.showToast("Second"));
    act(() => vi.advanceTimersByTime(800));
    expect(result.current.toast).toBe("Second");
  });

  it("honours a per-toast duration and can be cleared early", () => {
    const { result } = renderHook(() => useToast(1000));
    act(() => result.current.showToast("Long", 5000));
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.toast).toBe("Long");
    act(() => result.current.clearToast());
    expect(result.current.toast).toBeNull();
  });
});
