"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/providers/auth-provider";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localeDirection, localeNames, type Locale } from "@/lib/i18n/config";
import { Settings as SettingsIcon, Globe, Building2 } from "lucide-react";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { tenant } = useAuth();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    document.documentElement.dir =
      localeDirection[currentLang as Locale] || "ltr";
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const changeLanguage = useCallback(
    (lang: string) => {
      i18n.changeLanguage(lang);
      setCurrentLang(lang);
    },
    [i18n],
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-7 w-7 text-sky-500" />
          {t("settings.title")}
        </h1>
      </div>

      {/* Language */}
      <GlassCard variant="elevated">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-5 w-5 text-sky-500" />
          <h2 className="font-bold">{t("settings.language")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(localeNames) as [Locale, string][]).map(
            ([code, name]) => (
              <button
                key={code}
                onClick={() => changeLanguage(code)}
                className={`p-3 rounded-xl border-2 text-center font-semibold transition-all ${
                  i18n.language === code
                    ? "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-400"
                    : "border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300"
                }`}
              >
                {name}
              </button>
            ),
          )}
        </div>
      </GlassCard>

      {/* Dealership Info */}
      <GlassCard variant="elevated">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-sky-500" />
          <h2 className="font-bold">{t("settings.dealershipName")}</h2>
        </div>
        <div className="space-y-3">
          <Input
            label={t("settings.dealershipName")}
            defaultValue={tenant?.name || ""}
          />
          <Input
            label={t("settings.phone")}
            defaultValue={tenant?.phone || ""}
          />
          <Input
            label={t("settings.address")}
            defaultValue={tenant?.address || ""}
          />
          <Button variant="primary" className="w-full">
            {t("app.save")}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
