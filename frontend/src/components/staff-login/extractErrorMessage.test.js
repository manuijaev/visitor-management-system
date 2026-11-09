import { describe, expect, it } from "vitest";
import { extractErrorMessage } from "./extractErrorMessage";

const withData = (data) => ({ response: { data } });

describe("extractErrorMessage", () => {
  it("uses the fallback without response data", () => {
    expect(extractErrorMessage(new Error("x"), "Fallback")).toBe("Fallback");
    expect(extractErrorMessage(undefined, "Fallback")).toBe("Fallback");
  });

  it("prefers detail as a string or list", () => {
    expect(extractErrorMessage(withData({ detail: "Nope" }), "F")).toBe("Nope");
    expect(extractErrorMessage(withData({ detail: ["First"] }), "F")).toBe(
      "First",
    );
  });

  it("reads the first field error", () => {
    expect(
      extractErrorMessage(withData({ password: ["Too short"] }), "F"),
    ).toBe("Too short");
    expect(extractErrorMessage(withData({ email: "Taken" }), "F")).toBe(
      "Taken",
    );
  });

  it("falls back for empty or unknown shapes", () => {
    expect(extractErrorMessage(withData({}), "F")).toBe("F");
    expect(extractErrorMessage(withData({ code: 42 }), "F")).toBe("F");
    expect(extractErrorMessage(withData({ detail: [] }), "F")).toBe("F");
  });
});
