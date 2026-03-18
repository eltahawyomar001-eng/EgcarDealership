import React from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  asChild = false,
  className,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  const variants = {
    primary:
      "bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25 active:scale-[0.98]",
    secondary:
      "bg-white/10 hover:bg-white/20 text-white border border-white/10",
    danger:
      "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 active:scale-[0.98]",
    ghost: "hover:bg-white/10 text-gray-600 dark:text-gray-300",
    outline:
      "border-2 border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white",
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5 rounded-lg",
    md: "text-sm px-5 py-2.5 rounded-xl",
    lg: "text-base px-7 py-3.5 rounded-xl",
    icon: "p-2.5 rounded-xl",
  };

  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
