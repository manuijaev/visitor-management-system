import { describe, expect, it } from "vitest";
import { extractSignupError } from "./signupError";

describe("extractSignupError", () => {
  it("uses the fallback without response data", () => {
    expect(extractSignupError({}, "Oops")).toBe("Oops");
  });

  it("prefers detail, then the first field error", () => {
    expect(
      extractSignupError({ response: { data: { detail: "No" } } }, "x"),
    ).toBe("No");
    expect(
      extractSignupError({ response: { data: { email: ["Taken"] } } }, "x"),
    ).toBe("Taken");
    expect(
      extractSignupError({ response: { data: { email: "Bad" } } }, "x"),
    ).toBe("Bad");
    expect(extractSignupError({ response: { data: { email: [] } } }, "x")).toBe(
      "x",
    );
  });
});
