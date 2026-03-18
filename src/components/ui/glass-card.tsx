import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}

export function GlassCard({
  children,
  variant = "default",
  padding = "md",
  className,
  ...props
}: GlassCardProps) {
  const variants = {
    default:
      "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10",
    elevated:
      "bg-white/70 dark:bg-white/8 backdrop-blur-2xl border border-white/30 dark:border-white/15 shadow-xl shadow-black/5",
    interactive:
      "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-lg transition-all duration-300 cursor-pointer",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-7",
  };

  return (
    <div
      className={cn(
        "rounded-2xl",
        variants[variant],
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
