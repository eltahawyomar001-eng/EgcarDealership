"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  count?: number;
}

/**
 * Skeleton — Animated placeholder matching glassmorphism style.
 * Never show a blank spinner — use skeleton loaders.
 */
export function Skeleton({
  className,
  variant = "rounded",
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClass = "skeleton-shimmer bg-gray-200/60 dark:bg-white/8";

  const variants = {
    text: "rounded-md h-4",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-2xl",
  };

  const style: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  if (count === 1) {
    return (
      <div
        className={cn(baseClass, variants[variant], className)}
        style={style}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClass, variants[variant], className)}
          style={style}
        />
      ))}
    </div>
  );
}

/**
 * StatCardSkeleton — Matches the StatCard layout.
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton variant="text" className="h-3 w-24" />
          <Skeleton variant="text" className="h-8 w-32" />
          <Skeleton variant="text" className="h-3 w-20" />
        </div>
        <Skeleton variant="circular" className="h-12 w-12" />
      </div>
    </div>
  );
}

/**
 * PaymentListSkeleton — Matches the payment list items.
 */
export function PaymentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/5"
        >
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-28" />
            <Skeleton variant="text" className="h-3 w-40" />
          </div>
          <div className="space-y-2 flex flex-col items-end">
            <Skeleton variant="text" className="h-4 w-20" />
            <Skeleton variant="rounded" className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * CarCardSkeleton — Matches the car inventory card layout.
 */
export function CarCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 overflow-hidden">
      <Skeleton variant="rectangular" className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <div className="flex justify-between">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="text" className="h-4 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rounded" className="h-6 w-16" />
          <Skeleton variant="rounded" className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * DashboardSkeleton — Full dashboard Bento Grid skeleton.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton variant="text" className="h-8 w-48" />
        <Skeleton variant="text" className="h-4 w-64" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Payment list */}
        <div className="md:col-span-2 rounded-2xl bg-white/70 dark:bg-white/8 backdrop-blur-2xl border border-white/30 dark:border-white/15 shadow-xl shadow-black/5 p-5">
          <Skeleton variant="text" className="h-6 w-44 mb-4" />
          <PaymentListSkeleton count={4} />
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/70 dark:bg-white/8 backdrop-blur-2xl border border-white/30 dark:border-white/15 shadow-xl shadow-black/5 p-5"
            >
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="h-10 w-10" />
                <div className="space-y-2 flex-1">
                  <Skeleton variant="text" className="h-3 w-20" />
                  <Skeleton variant="text" className="h-6 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * TableSkeleton — For inventory, sales, installments lists.
 */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 p-4"
        >
          <div className="flex items-center gap-4">
            <Skeleton variant="rounded" className="h-14 w-14 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="h-4 w-40" />
              <Skeleton variant="text" className="h-3 w-60" />
            </div>
            <div className="space-y-2 hidden md:block">
              <Skeleton variant="text" className="h-4 w-24" />
              <Skeleton variant="rounded" className="h-5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
