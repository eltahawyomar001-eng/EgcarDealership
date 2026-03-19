"use client";

import React, { createContext, useContext, useEffect } from "react";
import { usePWA } from "@/hooks/use-pwa";

type PWAContextType = ReturnType<typeof usePWA>;

const PWAContext = createContext<PWAContextType | null>(null);

/**
 * PWAProvider — Initializes PWA features (service worker, sync, badge).
 * Wrap your app to provide PWA capabilities to all components.
 */
export function PWAProvider({ children }: { children: React.ReactNode }) {
  const pwa = usePWA();

  // Register service worker on mount
  useEffect(() => {
    pwa.registerSW();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for sync messages from service worker
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_DRAFTS") {
        pwa.syncDrafts();
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update badge when pending drafts change
  useEffect(() => {
    if (pwa.pendingDrafts > 0) {
      pwa.setBadge(pwa.pendingDrafts);
    } else {
      pwa.clearBadge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pwa.pendingDrafts]);

  return <PWAContext.Provider value={pwa}>{children}</PWAContext.Provider>;
}

/**
 * Hook to access PWA context from any component.
 */
export function usePWAContext(): PWAContextType {
  const ctx = useContext(PWAContext);
  if (!ctx) {
    throw new Error("usePWAContext must be used within PWAProvider");
  }
  return ctx;
}
