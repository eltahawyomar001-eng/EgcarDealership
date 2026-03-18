import React from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "sky" | "emerald" | "amber" | "red" | "violet";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "sky",
  className,
}: StatCardProps) {
  const colors = {
    sky: "from-sky-500/20 to-sky-500/5 text-sky-600 dark:text-sky-400",
    emerald:
      "from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    amber:
      "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400",
    red: "from-red-500/20 to-red-500/5 text-red-600 dark:text-red-400",
    violet:
      "from-violet-500/20 to-violet-500/5 text-violet-600 dark:text-violet-400",
  };

  const iconBg = {
    sky: "bg-sky-500/15",
    emerald: "bg-emerald-500/15",
    amber: "bg-amber-500/15",
    red: "bg-red-500/15",
    violet: "bg-violet-500/15",
  };

  return (
    <GlassCard
      variant="elevated"
      className={cn("relative overflow-hidden", className)}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-30",
          colors[color],
        )}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl", iconBg[color])}>
            <Icon className={cn("h-5 w-5", colors[color].split(" ").pop())} />
          </div>
          {trend && trendValue && (
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                trend === "up"
                  ? "bg-emerald-500/15 text-emerald-600"
                  : trend === "down"
                    ? "bg-red-500/15 text-red-600"
                    : "bg-gray-500/15 text-gray-600",
              )}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </GlassCard>
  );
}
