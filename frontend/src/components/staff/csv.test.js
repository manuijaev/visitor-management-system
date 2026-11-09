import { describe, expect, it } from "vitest";
import { buildRequestsCsv } from "./csv";

describe("buildRequestsCsv", () => {
  it("writes a header and escapes quotes", () => {
    const csv = buildRequestsCsv([
      {
        id: 7,
        visitor_name: 'Ann "AJ" Lee',
        visitor_email: "ann@example.com",
        status: "Pending",
        message: "Hi",
      },
    ]);
    const [header, row] = csv.split("\n");

    expect(header).toBe(
      "ID,Visitor Name,Visitor Email,Student,Date/Time Sent,Date/Time,Status,Visitor Message,Staff Response",
    );
    expect(row).toBe(
      '7,"Ann ""AJ"" Lee","ann@example.com","","","",Pending,"Hi",""',
    );
  });
});
