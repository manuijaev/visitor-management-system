import { describe, expect, it } from "vitest";
import {
  describeError,
  isValidPhone,
  passCopy,
  studentLabel,
  submitLabel,
  visitNote,
  visitReference,
  whenLabel,
} from "./visit";

const visitor = {
  name: "Sarah Kiprono",
  phone: "0712 345 678",
  email: "",
  studentName: " Brian ",
  studentClass: " 5E ",
  purpose: "Other",
  message: " Hi ",
};

describe("visit helpers", () => {
  it("validates phone numbers", () => {
    expect(isValidPhone("(0712) 345-678")).toBe(true);
    expect(isValidPhone("+254712345678")).toBe(true);
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone(undefined)).toBe(false);
  });

  it("summarises the student and note", () => {
    expect(studentLabel(visitor)).toBe("Brian (5E)");
    expect(visitNote(visitor)).toBe("Purpose: Other · Hi");
  });

  it("formats references", () => {
    expect(visitReference(12)).toBe("GP-00012");
    expect(visitReference(null)).toMatch(/^GP-\d{6}$/);
  });

  it("describes server errors", () => {
    expect(
      describeError({ response: { data: { visitor_phone: ["Bad."] } } }),
    ).toBe("Visitor phone: Bad.");
    expect(describeError({ response: { data: { detail: "Nope" } } })).toBe(
      "Nope",
    );
    expect(describeError({})).toMatch(/couldn't reach the server/);
    expect(describeError({ response: { data: null } })).toMatch(
      /Something went wrong/,
    );
  });

  it("labels the visit time and submit button", () => {
    expect(whenLabel({ mode: "onway", eta: 30 })).toBe("In about 30 minutes");
    expect(
      whenLabel({ mode: "later", slot: "2026-11-10T14:30:00+03:00" }),
    ).toBe("Tuesday 10 November, 2:30 PM");
    expect(whenLabel({ mode: null })).toBe("Not chosen yet");
    expect(submitLabel("now", "Mary")).toBe("Alert Mary now");
    expect(submitLabel("onway", "Mary")).toBe("Let Mary know");
    expect(submitLabel("later", "Mary")).toBe("Send visit request");
  });

  it("writes the visit pass copy", () => {
    const copy = passCopy({
      mode: "later",
      arrival: "2026-11-10T14:30:00+03:00",
      host: { name: "Mary Wanjiru" },
      visitor,
    });
    expect(copy).toEqual({
      headline: "You're booked in, Sarah.",
      body: "Mary Wanjiru will confirm your visit for Tuesday 10 November at 2:30 PM.",
      when: "Tue 10 Nov, 2:30 PM",
    });
  });
});
