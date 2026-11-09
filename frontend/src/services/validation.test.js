import { describe, expect, it } from "vitest";
import { isValidEmail } from "./validation";

describe("isValidEmail", () => {
  it.each(["jane@school.ac.ke", "a.b+c@x.io", "  jane@school.org  "])(
    "accepts %s",
    (email) => expect(isValidEmail(email)).toBe(true),
  );

  it.each(["", "jane", "jane@school", "jane@@school.org", "ja ne@school.org", "jane@.org", "jane@school.", "jane@school..org"])(
    "rejects %s",
    (email) => expect(isValidEmail(email)).toBe(false),
  );

  it("stays fast on long near-miss input", () => {
    const input = `a@${"b.".repeat(50000)}`;
    const start = performance.now();
    expect(isValidEmail(input)).toBe(false);
    expect(performance.now() - start).toBeLessThan(50);
  });
});
