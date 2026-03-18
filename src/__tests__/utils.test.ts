import { describe, it, expect } from "vitest";
import {
  formatEGP,
  formatDate,
  calculateProfit,
  calculateProfitPercentage,
  isOverdue,
  getStatusColor,
  cn,
} from "@/lib/utils";

describe("formatEGP", () => {
  it("formats positive amounts correctly", () => {
    const result = formatEGP(1500000);
    expect(result).toContain("1,500,000");
    expect(result).toContain("EGP");
  });

  it("formats zero", () => {
    const result = formatEGP(0);
    expect(result).toContain("0");
    expect(result).toContain("EGP");
  });

  it("formats negative amounts", () => {
    const result = formatEGP(-50000);
    expect(result).toContain("50,000");
  });
});

describe("calculateProfit", () => {
  it("calculates positive profit", () => {
    expect(calculateProfit(500000, 650000)).toBe(150000);
  });

  it("calculates negative profit (loss)", () => {
    expect(calculateProfit(500000, 450000)).toBe(-50000);
  });

  it("calculates zero profit", () => {
    expect(calculateProfit(500000, 500000)).toBe(0);
  });
});

describe("calculateProfitPercentage", () => {
  it("calculates correct percentage", () => {
    expect(calculateProfitPercentage(500000, 600000)).toBe(20);
  });

  it("handles zero purchase price", () => {
    expect(calculateProfitPercentage(0, 100000)).toBe(0);
  });

  it("calculates negative percentage", () => {
    expect(calculateProfitPercentage(500000, 400000)).toBe(-20);
  });
});

describe("isOverdue", () => {
  it("returns true for past dates", () => {
    expect(isOverdue("2020-01-01")).toBe(true);
  });

  it("returns false for future dates", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isOverdue(future)).toBe(false);
  });
});

describe("getStatusColor", () => {
  it("returns emerald classes for available", () => {
    expect(getStatusColor("available")).toContain("emerald");
  });

  it("returns red classes for overdue", () => {
    expect(getStatusColor("overdue")).toContain("red");
  });

  it("returns amber classes for reserved", () => {
    expect(getStatusColor("reserved")).toContain("amber");
  });

  it("returns default classes for unknown status", () => {
    expect(getStatusColor("unknown_status")).toContain("gray");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves Tailwind conflicts", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });
});

describe("formatDate", () => {
  it("formats date in English", () => {
    const result = formatDate("2026-03-18", "en");
    expect(result).toContain("18");
    expect(result).toContain("Mar");
    expect(result).toContain("2026");
  });

  it("formats date in Arabic", () => {
    const result = formatDate("2026-03-18", "ar");
    expect(result).toBeTruthy();
  });
});
