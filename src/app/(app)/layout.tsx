"use client";

import React from "react";
import { DesktopSidebar } from "@/components/navigation/desktop-sidebar";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { TopBar } from "@/components/navigation/top-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop: Sidebar */}
      <DesktopSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile: Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
