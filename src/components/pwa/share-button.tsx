"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Share2 } from "lucide-react";
import { shareContent, canShare, type ShareData } from "@/lib/pwa/share";
import { triggerHaptic } from "@/lib/pwa/haptics";
import { useToast } from "@/components/ui/toast";

interface ShareButtonProps {
  data: ShareData;
  className?: string;
  variant?: "icon" | "button";
  size?: "sm" | "md";
}

/**
 * ShareButton — Opens native share sheet or copies to clipboard.
 */
export function ShareButton({
  data,
  className = "",
  variant = "icon",
  size = "md",
}: ShareButtonProps) {
  const { t } = useTranslation();
  const { toast: showToast } = useToast();

  const handleShare = async () => {
    triggerHaptic("light");
    const result = await shareContent(data);

    if (result === "shared") {
      triggerHaptic("success");
    } else if (result === "copied") {
      triggerHaptic("success");
      showToast(t("pwa.copiedToClipboard"), "success");
    } else {
      triggerHaptic("error");
    }
  };

  if (variant === "icon") {
    const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
    const btnSize = size === "sm" ? "p-1.5" : "p-2";
    return (
      <button
        onClick={handleShare}
        className={`${btnSize} rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors touch-target ${className}`}
        title={canShare() ? t("pwa.share") : t("pwa.copy")}
      >
        <Share2 className={`${iconSize} text-gray-500`} />
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 text-sm font-medium transition-colors touch-target ${className}`}
    >
      <Share2 className="h-4 w-4" />
      {canShare() ? t("pwa.share") : t("pwa.copy")}
    </button>
  );
}
