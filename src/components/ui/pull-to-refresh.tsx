"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { triggerHaptic } from "@/lib/pwa/haptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  /** Minimum pull distance in pixels to trigger refresh */
  threshold?: number;
  /** Whether pull-to-refresh is enabled */
  enabled?: boolean;
}

/**
 * PullToRefresh — Glassmorphism-styled pull-to-refresh gesture.
 * Designed for mobile dealership owners checking latest EGP prices.
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  enabled = true,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAtTop = useCallback(() => {
    if (!containerRef.current) return false;
    // Check if the scroll container is at the top
    return window.scrollY <= 0;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || isRefreshing || !isAtTop()) return;
      touchStartY.current = e.touches[0].clientY;
    },
    [enabled, isRefreshing, isAtTop],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || isRefreshing || touchStartY.current === 0) return;
      if (!isAtTop()) {
        touchStartY.current = 0;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;

      if (diff > 0) {
        // Apply rubber-band resistance
        const distance = Math.min(diff * 0.5, threshold * 1.8);
        setPullDistance(distance);

        // Haptic when crossing threshold
        if (distance >= threshold && !hasTriggered) {
          triggerHaptic("medium");
          setHasTriggered(true);
        } else if (distance < threshold && hasTriggered) {
          setHasTriggered(false);
        }
      }
    },
    [enabled, isRefreshing, threshold, hasTriggered, isAtTop],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6);
      triggerHaptic("success");

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setHasTriggered(false);
      }
    } else {
      setPullDistance(0);
      setHasTriggered(false);
    }

    touchStartY.current = 0;
  }, [enabled, isRefreshing, pullDistance, threshold, onRefresh]);

  // Reset when not touching
  useEffect(() => {
    if (!isRefreshing && pullDistance === 0) {
      setHasTriggered(false);
    }
  }, [isRefreshing, pullDistance]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator — glassmorphism style */}
      <div
        className="absolute inset-x-0 top-0 flex justify-center z-50 pointer-events-none"
        style={{
          transform: `translateY(${showIndicator ? pullDistance - 40 : -40}px)`,
          opacity: showIndicator ? 1 : 0,
          transition:
            isRefreshing || pullDistance === 0 ? "all 0.3s ease" : "none",
        }}
      >
        <div
          className="bg-white/80 dark:bg-white/10 backdrop-blur-2xl border border-white/30 dark:border-white/15
                     rounded-full px-4 py-2 shadow-xl shadow-black/5 flex items-center gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 text-sky-500 animate-spin" />
          ) : (
            <div
              className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full"
              style={{
                transform: `rotate(${progress * 360}deg)`,
                opacity: progress,
              }}
            />
          )}
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {isRefreshing
              ? "Refreshing..."
              : progress >= 1
                ? "Release to refresh"
                : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform: `translateY(${pullDistance > 10 ? pullDistance * 0.3 : 0}px)`,
          transition:
            isRefreshing || pullDistance === 0 ? "transform 0.3s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
