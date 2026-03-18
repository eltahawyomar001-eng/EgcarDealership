"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { formatEGP, formatDate, cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import type { Sale } from "@/lib/types";
import { Receipt, Plus, TrendingUp, User } from "lucide-react";

export default function SalesPage() {
  const { t, i18n } = useTranslation();
  const supabase = createClient();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSales() {
      const { data } = await supabase
        .from("sales")
        .select("*, car:cars(*)")
        .order("created_at", { ascending: false });
      setSales((data as Sale[]) || []);
      setLoading(false);
    }
    fetchSales();
  }, [supabase]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-7 w-7 text-sky-500" />
            {t("sales.title")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {sales.length} {t("sales.title").toLowerCase()}
          </p>
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4 me-2" />
          {t("sales.newSale")}
        </Button>
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
        </div>
      ) : sales.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("app.noData")}</p>
        </GlassCard>
      ) : (
        <BentoGrid columns={2}>
          {sales.map((sale) => {
            const profit = sale.car
              ? sale.sale_price - sale.car.purchase_price
              : 0;

            return (
              <BentoItem key={sale.id}>
                <GlassCard variant="interactive">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-base">
                        {sale.car
                          ? `${sale.car.make} ${sale.car.model} ${sale.car.year}`
                          : "—"}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <User className="h-3 w-3" />
                        {sale.buyer_name}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <StatusBadge
                        status={sale.status}
                        label={t(`sales.${sale.status}`)}
                        size="sm"
                      />
                      <StatusBadge
                        status={sale.sale_type === "cash" ? "paid" : "upcoming"}
                        label={t(`sales.${sale.sale_type}`)}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">
                        {t("sales.salePrice")}
                      </p>
                      <p className="font-semibold">
                        {formatEGP(sale.sale_price)}
                      </p>
                    </div>
                    {sale.sale_type === "installment" && (
                      <>
                        <div>
                          <p className="text-xs text-gray-400">
                            {t("sales.downPayment")}
                          </p>
                          <p className="font-semibold">
                            {formatEGP(sale.down_payment)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">
                            {t("sales.remaining")}
                          </p>
                          <p className="font-semibold text-amber-600">
                            {formatEGP(sale.remaining_amount)}
                          </p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">
                        {t("sales.profit")}
                      </p>
                      <p
                        className={cn(
                          "font-semibold flex items-center gap-1",
                          profit >= 0 ? "text-emerald-600" : "text-red-600",
                        )}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {formatEGP(profit)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-white/5 text-xs text-gray-400">
                    {formatDate(sale.sold_at, i18n.language)}
                  </div>
                </GlassCard>
              </BentoItem>
            );
          })}
        </BentoGrid>
      )}
    </div>
  );
}
