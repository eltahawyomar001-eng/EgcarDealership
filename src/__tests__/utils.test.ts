import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatEGP,
  formatEGPArabic,
  formatDate,
  formatDateTime,
  calculateProfit,
  calculateProfitPercentage,
  isOverdue,
  getStatusColor,
  cn,
  isMobileDevice,
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

// ============================================================================
// formatEGPArabic
// ============================================================================
describe("formatEGPArabic", () => {
  it("formats positive amounts in Arabic", () => {
    const result = formatEGPArabic(1500000);
    expect(result).toBeTruthy();
    // Arabic locale uses Arabic-Indic numerals or standard digits
    expect(result.length).toBeGreaterThan(0);
  });

  it("formats zero in Arabic", () => {
    const result = formatEGPArabic(0);
    expect(result).toBeTruthy();
  });

  it("formats small amounts in Arabic", () => {
    const result = formatEGPArabic(100);
    expect(result).toBeTruthy();
  });

  it("formats large amounts in Arabic", () => {
    const result = formatEGPArabic(10000000);
    expect(result).toBeTruthy();
  });

  it("formats negative amounts in Arabic", () => {
    const result = formatEGPArabic(-250000);
    expect(result).toBeTruthy();
  });
});

// ============================================================================
// formatEGP — Extended edge cases
// ============================================================================
describe("formatEGP — edge cases", () => {
  it("formats very large amounts", () => {
    const result = formatEGP(999999999);
    expect(result).toContain("999,999,999");
  });

  it("formats very small amounts", () => {
    const result = formatEGP(1);
    expect(result).toContain("1");
  });

  it("formats decimal amounts (rounds to zero decimals)", () => {
    const result = formatEGP(1500.75);
    // Should round since maximumFractionDigits is 0
    expect(result).toContain("1,501");
  });
});

// ============================================================================
// formatDateTime
// ============================================================================
describe("formatDateTime", () => {
  it("formats date with time in English", () => {
    const result = formatDateTime("2026-03-18T14:30:00Z", "en");
    expect(result).toContain("18");
    expect(result).toBeTruthy();
  });

  it("formats date with time in Arabic", () => {
    const result = formatDateTime("2026-03-18T14:30:00Z", "ar");
    expect(result).toBeTruthy();
  });

  it("accepts Date object", () => {
    const date = new Date("2026-06-15T09:00:00Z");
    const result = formatDateTime(date, "en");
    expect(result).toBeTruthy();
    expect(result).toContain("15");
  });

  it("defaults to English locale", () => {
    const result = formatDateTime("2026-03-18T14:30:00Z");
    expect(result).toBeTruthy();
  });
});

// ============================================================================
// formatDate — Extended
// ============================================================================
describe("formatDate — extended", () => {
  it("accepts Date object", () => {
    const date = new Date("2026-06-15");
    const result = formatDate(date, "en");
    expect(result).toContain("15");
  });

  it("defaults to English locale", () => {
    const result = formatDate("2026-12-25");
    expect(result).toContain("25");
    expect(result).toContain("Dec");
  });

  it("formats leap year date", () => {
    const result = formatDate("2024-02-29", "en");
    expect(result).toContain("29");
    expect(result).toContain("Feb");
  });
});

// ============================================================================
// calculateProfit — Extended
// ============================================================================
describe("calculateProfit — extended", () => {
  it("handles very large numbers", () => {
    expect(calculateProfit(5000000, 7000000)).toBe(2000000);
  });

  it("handles decimal prices", () => {
    expect(calculateProfit(100.5, 200.75)).toBeCloseTo(100.25);
  });
});

// ============================================================================
// calculateProfitPercentage — Extended
// ============================================================================
describe("calculateProfitPercentage — extended", () => {
  it("calculates 100% profit (doubling)", () => {
    expect(calculateProfitPercentage(500000, 1000000)).toBe(100);
  });

  it("calculates 50% loss", () => {
    expect(calculateProfitPercentage(1000000, 500000)).toBe(-50);
  });

  it("handles small margins", () => {
    const result = calculateProfitPercentage(100000, 101000);
    expect(result).toBeCloseTo(1);
  });
});

// ============================================================================
// isOverdue — Extended
// ============================================================================
describe("isOverdue — extended", () => {
  it("returns true for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isOverdue(yesterday)).toBe(true);
  });

  it("returns false for tomorrow", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isOverdue(tomorrow)).toBe(false);
  });

  it("accepts string dates", () => {
    expect(isOverdue("2020-06-15")).toBe(true);
  });

  it("accepts Date objects", () => {
    const pastDate = new Date("2020-01-01");
    expect(isOverdue(pastDate)).toBe(true);
  });

  it("returns false for far future", () => {
    expect(isOverdue("2099-12-31")).toBe(false);
  });
});

// ============================================================================
// getStatusColor — Extended (all statuses)
// ============================================================================
describe("getStatusColor — all statuses", () => {
  it("returns emerald for 'paid'", () => {
    expect(getStatusColor("paid")).toContain("emerald");
  });

  it("returns emerald for 'completed'", () => {
    expect(getStatusColor("completed")).toContain("emerald");
  });

  it("returns blue for 'sold'", () => {
    expect(getStatusColor("sold")).toContain("blue");
  });

  it("returns blue for 'upcoming'", () => {
    expect(getStatusColor("upcoming")).toContain("blue");
  });

  it("returns amber for 'partially_paid'", () => {
    expect(getStatusColor("partially_paid")).toContain("amber");
  });

  it("returns amber for 'pending'", () => {
    expect(getStatusColor("pending")).toContain("amber");
  });

  it("returns gray for 'cancelled'", () => {
    expect(getStatusColor("cancelled")).toContain("gray");
  });

  it("returns emerald for 'clock_in'", () => {
    expect(getStatusColor("clock_in")).toContain("emerald");
  });

  it("returns gray for 'clock_out'", () => {
    expect(getStatusColor("clock_out")).toContain("gray");
  });

  it("returns gray for empty string", () => {
    expect(getStatusColor("")).toContain("gray");
  });

  it("each status returns border classes", () => {
    const statuses = [
      "available",
      "reserved",
      "sold",
      "paid",
      "upcoming",
      "overdue",
      "partially_paid",
      "pending",
      "completed",
      "cancelled",
      "clock_in",
      "clock_out",
    ];
    statuses.forEach((status) => {
      expect(getStatusColor(status)).toContain("border-");
    });
  });
});

// ============================================================================
// cn — Extended
// ============================================================================
describe("cn — extended", () => {
  it("handles undefined inputs", () => {
    expect(cn("base", undefined, "extra")).toBe("base extra");
  });

  it("handles null inputs", () => {
    expect(cn("base", null, "extra")).toBe("base extra");
  });

  it("handles empty strings", () => {
    expect(cn("", "px-2")).toBe("px-2");
  });

  it("merges multiple Tailwind conflicts correctly", () => {
    const result = cn("px-2 py-1 text-sm", "px-4 text-lg");
    expect(result).toContain("px-4");
    expect(result).toContain("text-lg");
    expect(result).not.toContain("px-2");
    expect(result).not.toContain("text-sm");
  });

  it("handles array of classes", () => {
    expect(cn(["px-2", "py-1"])).toBe("px-2 py-1");
  });
});

// ============================================================================
// isMobileDevice
// ============================================================================
describe("isMobileDevice", () => {
  const originalNavigator = navigator.userAgent;

  it("returns false in jsdom (no mobile UA)", () => {
    expect(isMobileDevice()).toBe(false);
  });

  it("detects iPhone user agent", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      writable: true,
    });
    expect(isMobileDevice()).toBe(true);
    Object.defineProperty(navigator, "userAgent", {
      value: originalNavigator,
      writable: true,
    });
  });

  it("detects Android user agent", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 13; Pixel 7)",
      writable: true,
    });
    expect(isMobileDevice()).toBe(true);
    Object.defineProperty(navigator, "userAgent", {
      value: originalNavigator,
      writable: true,
    });
  });

  it("detects iPad user agent", () => {
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)",
      writable: true,
    });
    expect(isMobileDevice()).toBe(true);
    Object.defineProperty(navigator, "userAgent", {
      value: originalNavigator,
      writable: true,
    });
  });

  it("returns false for desktop user agent", () => {
    Object.defineProperty(navigator, "userAgent", {
      value:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      writable: true,
    });
    expect(isMobileDevice()).toBe(false);
    Object.defineProperty(navigator, "userAgent", {
      value: originalNavigator,
      writable: true,
    });
  });
});
