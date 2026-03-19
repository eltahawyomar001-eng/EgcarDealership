"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";

/**
 * InstallPrompt — Glassmorphism-styled PWA install banner.
 * Shows when the app can be installed and user hasn't dismissed it.
 */
export function InstallPrompt() {
  const { t } = useTranslation();
  const { canInstall, promptInstall, isStandalone } = usePWA();
  const [dismissed, setDismissed] = React.useState(false);

  // Check if previously dismissed in this session
  React.useEffect(() => {
    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) setDismissed(true);
  }, []);

  // Don't show if already installed, can't install, or dismissed
  if (!canInstall || isStandalone || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      handleDismiss();
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 inset-x-0 z-[90] flex justify-center px-4">
      <GlassCard
        variant="elevated"
        padding="sm"
        className="max-w-md w-full flex items-center gap-3 animate-slide-up"
      >
        <div className="p-2.5 rounded-xl bg-sky-500/15 shrink-0">
          <Smartphone className="h-5 w-5 text-sky-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{t("pwa.installTitle")}</p>
          <p className="text-xs text-gray-500 truncate">
            {t("pwa.installDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="primary" size="sm" onClick={handleInstall}>
            <Download className="h-4 w-4 me-1" />
            {t("pwa.install")}
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
