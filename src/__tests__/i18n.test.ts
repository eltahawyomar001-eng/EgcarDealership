import { describe, it, expect } from "vitest";
import {
  defaultLocale,
  locales,
  localeDirection,
  localeNames,
} from "@/lib/i18n/config";
import en from "@/lib/i18n/locales/en.json";
import ar from "@/lib/i18n/locales/ar.json";

describe("i18n configuration", () => {
  it("has English as default locale", () => {
    expect(defaultLocale).toBe("en");
  });

  it("supports English and Arabic", () => {
    expect(locales).toContain("en");
    expect(locales).toContain("ar");
    expect(locales).toHaveLength(2);
  });

  it("Arabic is RTL, English is LTR", () => {
    expect(localeDirection.ar).toBe("rtl");
    expect(localeDirection.en).toBe("ltr");
  });

  it("has display names for all locales", () => {
    expect(localeNames.en).toBe("English");
    expect(localeNames.ar).toBe("العربية");
  });

  it("all locales have a direction defined", () => {
    locales.forEach((locale) => {
      expect(localeDirection[locale]).toBeDefined();
      expect(["ltr", "rtl"]).toContain(localeDirection[locale]);
    });
  });

  it("all locales have a display name", () => {
    locales.forEach((locale) => {
      expect(localeNames[locale]).toBeTruthy();
    });
  });
});

describe("Translation completeness", () => {
  function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
    return Object.entries(obj).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null) {
        return getKeys(value as Record<string, unknown>, fullKey);
      }
      return [fullKey];
    });
  }

  function getValue(obj: Record<string, unknown>, keyPath: string): unknown {
    return keyPath
      .split(".")
      .reduce(
        (o: Record<string, unknown>, k) => o[k] as Record<string, unknown>,
        obj,
      );
  }

  it("Arabic has all the same keys as English", () => {
    const enKeys = getKeys(en);
    const arKeys = getKeys(ar);

    const missingInAr = enKeys.filter((k) => !arKeys.includes(k));
    expect(missingInAr).toEqual([]);
  });

  it("English has all the same keys as Arabic", () => {
    const enKeys = getKeys(en);
    const arKeys = getKeys(ar);

    const missingInEn = arKeys.filter((k) => !enKeys.includes(k));
    expect(missingInEn).toEqual([]);
  });

  it("all English values are non-empty strings", () => {
    const enKeys = getKeys(en);
    enKeys.forEach((key) => {
      const value = getValue(en as Record<string, unknown>, key);
      expect(
        value,
        `English key "${key}" should be a non-empty string`,
      ).toBeTruthy();
    });
  });

  it("all Arabic values are non-empty strings", () => {
    const arKeys = getKeys(ar);
    arKeys.forEach((key) => {
      const value = getValue(ar as Record<string, unknown>, key);
      expect(
        value,
        `Arabic key "${key}" should be a non-empty string`,
      ).toBeTruthy();
    });
  });
});

describe("Translation template variables", () => {
  function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
    return Object.entries(obj).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null) {
        return getKeys(value as Record<string, unknown>, fullKey);
      }
      return [fullKey];
    });
  }

  function getValue(obj: Record<string, unknown>, keyPath: string): string {
    return keyPath
      .split(".")
      .reduce(
        (o: Record<string, unknown>, k) => o[k] as Record<string, unknown>,
        obj,
      ) as unknown as string;
  }

  function extractTemplateVars(str: string): string[] {
    const matches = str.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.sort() : [];
  }

  it("Arabic has the same template variables as English for every key", () => {
    const enKeys = getKeys(en);
    enKeys.forEach((key) => {
      const enValue = getValue(en as Record<string, unknown>, key);
      let arValue: string;
      try {
        arValue = getValue(ar as Record<string, unknown>, key);
      } catch {
        return; // Key missing — caught by completeness tests
      }
      if (typeof enValue !== "string" || typeof arValue !== "string") return;

      const enVars = extractTemplateVars(enValue);
      const arVars = extractTemplateVars(arValue);
      expect(
        arVars,
        `Template vars mismatch for "${key}": EN=${JSON.stringify(enVars)} AR=${JSON.stringify(arVars)}`,
      ).toEqual(enVars);
    });
  });

  it("known template variables exist in both locales", () => {
    // Keys known to have template variables
    const keysWithVars: Record<string, string[]> = {
      "auth.loginWith": ["{{provider}}"],
      "auth.confirmationSent": ["{{email}}"],
      "attendance.accuracyMeters": ["{{meters}}"],
      "inventory.carsAffected": ["{{count}}"],
      "pwa.pendingSync": ["{{count}}"],
    };

    Object.entries(keysWithVars).forEach(([key, expectedVars]) => {
      const enValue = getValue(en as Record<string, unknown>, key);
      const arValue = getValue(ar as Record<string, unknown>, key);

      expectedVars.forEach((v) => {
        expect(
          (enValue as string).includes(v),
          `EN "${key}" should contain ${v}`,
        ).toBe(true);
        expect(
          (arValue as string).includes(v),
          `AR "${key}" should contain ${v}`,
        ).toBe(true);
      });
    });
  });
});

describe("Arabic translation quality", () => {
  function getLeafValues(
    obj: Record<string, unknown>,
    prefix = "",
  ): Array<{ key: string; value: string }> {
    return Object.entries(obj).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null) {
        return getLeafValues(value as Record<string, unknown>, fullKey);
      }
      return [{ key: fullKey, value: value as string }];
    });
  }

  it("Arabic values contain Arabic characters (not just Latin transliteration)", () => {
    const arValues = getLeafValues(ar);
    const arabicCharRegex = /[\u0600-\u06FF]/;
    // Keys that are intentionally English (brand names, etc.)
    const exceptions = [
      "auth.google",
      "auth.apple",
      "landing.pricingEnterpriseF3",
      "installments.instapay",
      "app.name",
      "landing.pricingProPrice",
      "landing.pricingStarterPrice",
      "landing.pricingEnterprisePrice",
    ];

    arValues.forEach(({ key, value }) => {
      if (exceptions.some((e) => key === e)) return;
      // Skip values that are just symbols or numbers
      if (/^[\d\s%.,+→✓]+$/.test(value)) return;

      expect(
        arabicCharRegex.test(value),
        `Arabic key "${key}" = "${value}" should contain Arabic characters`,
      ).toBe(true);
    });
  });

  it("no English words leaked into Arabic translations (except brands)", () => {
    const arValues = getLeafValues(ar);
    const brandExceptions = ["GPS", "API", "Google", "Apple", "CarOS", "EGP"];
    const keyExceptions = [
      "auth.google",
      "auth.apple",
      "landing.pricingEnterpriseF3",
      "installments.instapay",
      "app.name",
    ];

    arValues.forEach(({ key, value }) => {
      if (keyExceptions.some((e) => key === e)) return;

      // Strip template variables before checking
      const cleaned = value.replace(/\{\{[^}]+\}\}/g, "");
      // Check for common English words that shouldn't be in Arabic
      const englishWords = cleaned.match(/\b[A-Za-z]{4,}\b/g) || [];
      const nonBrandEnglish = englishWords.filter(
        (w) => !brandExceptions.includes(w),
      );
      expect(
        nonBrandEnglish,
        `Arabic key "${key}" has unexpected English words: ${nonBrandEnglish.join(", ")}`,
      ).toEqual([]);
    });
  });

  it("all translation sections are present in Arabic", () => {
    const expectedSections = [
      "app",
      "nav",
      "auth",
      "landing",
      "dashboard",
      "inventory",
      "sales",
      "installments",
      "attendance",
      "settings",
      "pwa",
      "rbac",
    ];
    const arSections = Object.keys(ar);
    expectedSections.forEach((section) => {
      expect(arSections, `Missing section: ${section}`).toContain(section);
    });
  });
});
