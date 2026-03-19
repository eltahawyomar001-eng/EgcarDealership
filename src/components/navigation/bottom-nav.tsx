"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/use-role";
import {
  LayoutDashboard,
  Car,
  Receipt,
  CalendarCheck,
  Settings,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    labelKey: "nav.dashboard",
    adminOnly: false,
  },
  {
    href: "/inventory",
    icon: Car,
    labelKey: "nav.inventory",
    adminOnly: false,
  },
  { href: "/sales", icon: Receipt, labelKey: "nav.sales", adminOnly: false },
  {
    href: "/installments",
    icon: CalendarCheck,
    labelKey: "nav.installments",
    adminOnly: false,
  },
  {
    href: "/settings",
    icon: Settings,
    labelKey: "nav.settings",
    adminOnly: true,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { canAccessSettings } = useRole();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || canAccessSettings,
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glassmorphism bottom bar */}
      <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border-t border-white/20 dark:border-white/5 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-1">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-300 min-w-[60px]",
                  isActive
                    ? "text-sky-600 dark:text-sky-400 bg-sky-500/10"
                    : "text-gray-400 dark:text-gray-500 active:scale-95",
                )}
              >
                <item.icon
                  className={cn("h-5 w-5", isActive && "stroke-[2.5]")}
                />
                <span className="text-[10px] font-medium truncate">
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
