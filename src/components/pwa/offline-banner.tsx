"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { WifiOff, CloudOff, RefreshCw } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";

/**
 * OfflineBanner — Shows when the device goes offline.
 * Displays pending draft count and syncs when back online.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOnline, pendingDrafts } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[110] safe-area-pt">
      <div className="bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-xl text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>{t("pwa.offlineMode")}</span>
        {pendingDrafts > 0 && (
          <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
            {pendingDrafts} {t("pwa.pendingSync")}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * SyncIndicator — Shows when drafts are being synced.
 */
export function SyncIndicator({ syncing }: { syncing: boolean }) {
  const { t } = useTranslation();

  if (!syncing) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[110] safe-area-pt">
      <div className="bg-sky-500/90 backdrop-blur-xl text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
        <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
        <span>{t("pwa.syncing")}</span>
      </div>
    </div>
  );
}

/**
 * OfflinePlaceholder — Full-page offline state.
 */
export function OfflinePlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="h-20 w-20 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-6">
        <CloudOff className="h-10 w-10 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold mb-2">{t("pwa.offlineTitle")}</h2>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        {t("pwa.offlineDescription")}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold transition-colors touch-target"
      >
        <RefreshCw className="h-4 w-4" />
        {t("pwa.retry")}
      </button>
    </div>
  );
}
