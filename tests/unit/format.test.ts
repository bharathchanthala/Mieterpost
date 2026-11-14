import { describe, expect, it } from "vitest";
import { formatDate, formatEuro, formatNumber, statusLabels } from "@/lib/format";

describe("format helpers", () => {
  it("turns integer cents into euros", () => {
    expect(formatEuro(52000)).toBe("€520.00");
    expect(formatEuro(1)).toBe("€0.01");
  });

  it("formats Postgres numeric strings as numbers", () => {
    expect(formatNumber("54.50")).toBe("54.5");
    expect(formatNumber("2.0")).toBe("2");
  });

  it("formats Postgres date strings", () => {
    expect(formatDate("2022-04-01")).toBe("1 Apr 2022");
  });

  it("has a label for every message status", () => {
    expect(Object.keys(statusLabels).sort()).toEqual(["answered", "drafted", "new"]);
  });
});
