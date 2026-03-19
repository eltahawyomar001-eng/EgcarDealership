"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  triggerHaptic,
  getUnsyncedCount,
  getUnsyncedDrafts,
  markDraftSynced,
  deleteDraft,
  saveSetting,
  getSetting,
} from "@/lib/pwa";
import { createClient } from "@/lib/supabase/client";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  /** Whether the device is currently online */
  isOnline: boolean;
  /** Whether the app is installed as PWA */
  isInstalled: boolean;
  /** Whether the install prompt is available */
  canInstall: boolean;
  /** Number of unsynced offline drafts */
  pendingDrafts: number;
  /** Whether the app is in standalone (PWA) mode */
  isStandalone: boolean;
  /** Whether data saver mode is enabled */
  dataSaverEnabled: boolean;
}

interface PWAActions {
  /** Show the PWA install prompt */
  promptInstall: () => Promise<boolean>;
  /** Trigger haptic feedback */
  haptic: (
    type?:
      | "success"
      | "error"
      | "warning"
      | "light"
      | "medium"
      | "heavy"
      | "selection",
  ) => void;
  /** Sync all pending offline drafts to Supabase */
  syncDrafts: () => Promise<number>;
  /** Update the app badge count */
  setBadge: (count: number) => Promise<void>;
  /** Clear the app badge */
  clearBadge: () => Promise<void>;
  /** Toggle data saver mode */
  toggleDataSaver: () => Promise<void>;
  /** Register the service worker */
  registerSW: () => Promise<void>;
}

/**
 * usePWA — Central hook for all PWA capabilities.
 *
 * Provides online/offline status, install prompt, haptic feedback,
 * offline draft syncing, app badging, and data saver mode.
 */
export function usePWA(): PWAState & PWAActions {
  const [isOnline, setIsOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState(0);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dataSaverEnabled, setDataSaverEnabled] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const supabase = createClient();

  // Online/offline detection
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when back online
      syncDraftsInternal();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Standalone detection
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(
      mq.matches ||
        !!(navigator as unknown as { standalone?: boolean }).standalone,
    );

    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Install prompt capture
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPrompt.current = null;
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  // Load data saver setting and pending draft count
  useEffect(() => {
    getSetting<boolean>("dataSaverEnabled")
      .then((val) => {
        if (val !== null) setDataSaverEnabled(val);
      })
      .catch(() => {});

    getUnsyncedCount()
      .then(setPendingDrafts)
      .catch(() => {});
  }, []);

  // Sync pending drafts to Supabase
  const syncDraftsInternal = useCallback(async (): Promise<number> => {
    if (!navigator.onLine) return 0;

    try {
      const drafts = await getUnsyncedDrafts();
      let synced = 0;

      for (const draft of drafts) {
        try {
          let success = false;

          switch (draft.type) {
            case "car_sale": {
              const { error } = await supabase.from("sales").insert(draft.data);
              success = !error;
              break;
            }
            case "installment_payment": {
              const { error } = await supabase
                .from("installments")
                .update({ status: "paid", paid_date: draft.data.paid_date })
                .eq("id", draft.data.id);
              success = !error;
              break;
            }
            case "car_addition": {
              const { error } = await supabase.from("cars").insert(draft.data);
              success = !error;
              break;
            }
            case "attendance_clockin": {
              const { error } = await supabase
                .from("attendance")
                .insert(draft.data);
              success = !error;
              break;
            }
          }

          if (success) {
            await markDraftSynced(draft.id);
            await deleteDraft(draft.id);
            synced++;
          }
        } catch {
          // Individual draft sync failed — continue with next
        }
      }

      const remaining = await getUnsyncedCount();
      setPendingDrafts(remaining);

      if (synced > 0) {
        triggerHaptic("success");
      }

      return synced;
    } catch {
      return 0;
    }
  }, [supabase]);

  // Prompt install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt.current) return false;

    try {
      const result = await deferredPrompt.current.prompt();
      const accepted = result.outcome === "accepted";
      if (accepted) {
        setIsInstalled(true);
        setCanInstall(false);
        triggerHaptic("success");
      }
      deferredPrompt.current = null;
      return accepted;
    } catch {
      return false;
    }
  }, []);

  // Haptic shortcut
  const haptic = useCallback(
    (
      type:
        | "success"
        | "error"
        | "warning"
        | "light"
        | "medium"
        | "heavy"
        | "selection" = "light",
    ) => {
      triggerHaptic(type);
    },
    [],
  );

  // App Badging API
  const setBadge = useCallback(async (count: number) => {
    if ("setAppBadge" in navigator) {
      try {
        await (
          navigator as unknown as {
            setAppBadge: (count: number) => Promise<void>;
          }
        ).setAppBadge(count);
      } catch {}
    }
  }, []);

  const clearBadge = useCallback(async () => {
    if ("clearAppBadge" in navigator) {
      try {
        await (
          navigator as unknown as { clearAppBadge: () => Promise<void> }
        ).clearAppBadge();
      } catch {}
    }
  }, []);

  // Data Saver toggle
  const toggleDataSaver = useCallback(async () => {
    const newValue = !dataSaverEnabled;
    setDataSaverEnabled(newValue);
    await saveSetting("dataSaverEnabled", newValue);
  }, [dataSaverEnabled]);

  // Register service worker
  const registerSW = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Request Background Sync when a draft is pending
        if ("sync" in registration) {
          const drafts = await getUnsyncedCount();
          if (drafts > 0) {
            await (
              registration as unknown as {
                sync: { register: (tag: string) => Promise<void> };
              }
            ).sync.register("sync-drafts");
          }
        }

        // Request Periodic Background Sync for price updates
        if ("periodicSync" in registration) {
          const status = await navigator.permissions.query({
            name: "periodic-background-sync" as PermissionName,
          });
          if (status.state === "granted") {
            await (
              registration as unknown as {
                periodicSync: {
                  register: (
                    tag: string,
                    options: { minInterval: number },
                  ) => Promise<void>;
                };
              }
            ).periodicSync.register("update-prices", {
              minInterval: 4 * 60 * 60 * 1000, // 4 hours
            });
          }
        }
      } catch (err) {
        console.warn("SW registration failed:", err);
      }
    }
  }, []);

  return {
    // State
    isOnline,
    isInstalled,
    canInstall,
    pendingDrafts,
    isStandalone,
    dataSaverEnabled,
    // Actions
    promptInstall,
    haptic,
    syncDrafts: syncDraftsInternal,
    setBadge,
    clearBadge,
    toggleDataSaver,
    registerSW,
  };
}
