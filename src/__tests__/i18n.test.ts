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

  it("all translation values are non-empty strings", () => {
    const enKeys = getKeys(en);
    enKeys.forEach((key) => {
      const value = key
        .split(".")
        .reduce(
          (obj: Record<string, unknown>, k) =>
            obj[k] as Record<string, unknown>,
          en as Record<string, unknown>,
        );
      expect(
        value,
        `English key "${key}" should be a non-empty string`,
      ).toBeTruthy();
    });
  });
});
