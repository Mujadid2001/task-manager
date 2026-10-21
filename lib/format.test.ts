import { describe, expect, it } from "vitest";

import { formatDate, formatDateTime } from "./format";

describe("formatDate", () => {
  it("formats an ISO timestamp using the pinned locale", () => {
    expect(formatDate("2026-10-21T12:00:00.000Z")).toBe("21 Oct 2026");
  });

  it("falls back for an unparseable timestamp", () => {
    expect(formatDate("not-a-date")).toBe("Unknown date");
  });
});

describe("formatDateTime", () => {
  it("includes the time of day", () => {
    expect(formatDateTime("2026-10-21T12:00:00.000Z")).toMatch(
      /^21 Oct 2026, \d{2}:\d{2}$/,
    );
  });

  it("falls back for an unparseable timestamp", () => {
    expect(formatDateTime("not-a-date")).toBe("Unknown date");
  });
});
