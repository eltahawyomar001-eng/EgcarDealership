"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { formatEGP } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import type { DealershipValuation, InstallmentSummary } from "@/lib/types";
import {
  Car,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Users,
  CalendarCheck,
  ShieldCheck,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const { t } = useTranslation();
  const supabase = createClient();
  const [valuation, setValuation] = useState<DealershipValuation | null>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<
    InstallmentSummary[]
  >([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        // Fetch valuation
        const { data: val } = await supabase
          .from("v_dealership_valuation")
          .select("*")
          .single();
        if (val) setValuation(val as DealershipValuation);

        // Fetch upcoming installments (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const { data: payments } = await supabase
          .from("v_installment_summary")
          .select("*")
          .in("status", ["upcoming", "overdue"])
          .lte("due_date", thirtyDaysFromNow.toISOString().split("T")[0])
          .order("due_date", { ascending: true })
          .limit(10);
        if (payments) setUpcomingPayments(payments as InstallmentSummary[]);

        // Overdue count
        const { count } = await supabase
          .from("installments")
          .select("*", { count: "exact", head: true })
          .eq("status", "overdue");
        setOverdueCount(count || 0);

        // Today's attendance count
        const { count: attendanceCount } = await supabase
          .from("v_today_attendance")
          .select("*", { count: "exact", head: true });
        setTodayAttendance(attendanceCount || 0);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t("dashboard.title")} 🎛️
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {new Date().toLocaleDateString("en-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stat cards - Bento grid */}
      <BentoGrid columns={4}>
        <BentoItem>
          <StatCard
            title={t("dashboard.availableCars")}
            value={valuation?.available_count ?? 0}
            icon={Car}
            color="sky"
            subtitle={t("dashboard.totalInventory")}
          />
        </BentoItem>
        <BentoItem>
          <StatCard
            title={t("dashboard.totalValue")}
            value={formatEGP(valuation?.available_value ?? 0)}
            icon={DollarSign}
            color="emerald"
          />
        </BentoItem>
        <BentoItem>
          <StatCard
            title={t("dashboard.potentialProfit")}
            value={formatEGP(valuation?.potential_profit ?? 0)}
            icon={TrendingUp}
            color="violet"
          />
        </BentoItem>
        <BentoItem>
          <StatCard
            title={t("dashboard.overduePayments")}
            value={overdueCount}
            icon={AlertTriangle}
            color={overdueCount > 0 ? "red" : "emerald"}
          />
        </BentoItem>
      </BentoGrid>

      {/* Second row */}
      <BentoGrid columns={3}>
        {/* Upcoming Payments */}
        <BentoItem span={2}>
          <GlassCard variant="elevated">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-sky-500" />
                {t("dashboard.upcomingPayments")}
              </h2>
            </div>
            {upcomingPayments.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">
                {t("installments.noUpcoming")}
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.map((payment) => (
                  <div
                    key={payment.installment_id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {payment.buyer_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {payment.car_name} • #{payment.installment_number}
                      </p>
                    </div>
                    <div className="text-end ms-4">
                      <p className="font-semibold text-sm">
                        {formatEGP(payment.amount_due)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge
                          status={payment.status}
                          label={t(`installments.${payment.status}`)}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </BentoItem>

        {/* Quick Stats */}
        <BentoItem>
          <div className="space-y-4">
            <GlassCard variant="elevated">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("dashboard.soldCars")}
                  </p>
                  <p className="text-xl font-bold">
                    {valuation?.sold_count ?? 0}
                  </p>
                </div>
              </div>
            </GlassCard>
            <GlassCard variant="elevated">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("dashboard.reservedCars")}
                  </p>
                  <p className="text-xl font-bold">
                    {valuation?.reserved_count ?? 0}
                  </p>
                </div>
              </div>
            </GlassCard>
            <GlassCard variant="elevated">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/15">
                  <Users className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("dashboard.todayAttendance")}
                  </p>
                  <p className="text-xl font-bold">{todayAttendance}</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </BentoItem>
      </BentoGrid>
    </div>
  );
}
