import React from "react";
import { cn, getStatusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusBadge({
  status,
  label,
  size = "md",
  className,
}: StatusBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border",
        getStatusColor(status),
        sizeClasses[size],
        className,
      )}
    >
      <span
        className={cn(
          "mr-1.5 rtl:mr-0 rtl:ml-1.5 h-1.5 w-1.5 rounded-full",
          status === "available" ||
            status === "paid" ||
            status === "completed" ||
            status === "clock_in"
            ? "bg-emerald-500"
            : status === "overdue" || status === "cancelled"
              ? "bg-red-500"
              : status === "reserved" ||
                  status === "pending" ||
                  status === "partially_paid"
                ? "bg-amber-500"
                : "bg-blue-500",
        )}
      />
      {label}
    </span>
  );
}
