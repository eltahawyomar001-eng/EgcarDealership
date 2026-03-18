"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import {
  LayoutDashboard,
  Car,
  Receipt,
  CalendarCheck,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/inventory", icon: Car, labelKey: "nav.inventory" },
  { href: "/sales", icon: Receipt, labelKey: "nav.sales" },
  { href: "/installments", icon: CalendarCheck, labelKey: "nav.installments" },
  { href: "/attendance", icon: MapPin, labelKey: "nav.attendance" },
  { href: "/settings", icon: Settings, labelKey: "nav.settings" },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, tenant, signOut } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col md:w-72 lg:w-80 h-screen sticky top-0 border-e border-gray-200/50 dark:border-white/5">
      {/* Glass background */}
      <div className="flex flex-col h-full bg-white/60 dark:bg-gray-950/60 backdrop-blur-2xl">
        {/* Logo / Tenant */}
        <div className="p-6 border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
                CarOS
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                {tenant?.name || "Egypt"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/5",
                )}
              >
                <item.icon
                  className={cn("h-5 w-5 shrink-0", isActive && "stroke-[2.5]")}
                />
                <span className="flex-1">{t(item.labelKey)}</span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 opacity-50 rtl:rotate-180" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.full_name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.full_name || "Guest"}
              </p>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role || "—"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </button>
        </div>
      </div>
    </aside>
  );
}
