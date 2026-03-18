"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/providers/auth-provider";
import { Globe, Bell } from "lucide-react";
import { localeDirection, type Locale } from "@/lib/i18n/config";

export function TopBar() {
  const { t, i18n } = useTranslation();
  const { user, tenant } = useAuth();

  const toggleLocale = () => {
    const newLocale: Locale = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLocale);
    document.documentElement.dir = localeDirection[newLocale];
    document.documentElement.lang = newLocale;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl border-b border-gray-200/50 dark:border-white/5">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        {/* Mobile: App title */}
        <div className="md:hidden flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-md shadow-sky-500/20">
            <span className="text-white text-xs font-black">C</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white">
            {tenant?.name || "CarOS"}
          </span>
        </div>

        {/* Desktop: Page context */}
        <div className="hidden md:block">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("app.tagline")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>{i18n.language === "en" ? "عربي" : "EN"}</span>
          </button>

          {/* Notifications placeholder */}
          <button className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-950" />
          </button>

          {/* Mobile user avatar */}
          <div className="md:hidden h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.full_name?.charAt(0).toUpperCase() || "?"}
          </div>
        </div>
      </div>
    </header>
  );
}
