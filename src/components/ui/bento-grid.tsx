import React from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function BentoGrid({
  children,
  columns = 3,
  className,
}: BentoGridProps) {
  const cols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", cols[columns], className)}>{children}</div>
  );
}

interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  span?: 1 | 2 | 3;
}

export function BentoItem({
  children,
  span = 1,
  className,
  ...props
}: BentoItemProps) {
  const spans = {
    1: "",
    2: "md:col-span-2",
    3: "md:col-span-2 lg:col-span-3",
  };

  return (
    <div className={cn(spans[span], className)} {...props}>
      {children}
    </div>
  );
}
