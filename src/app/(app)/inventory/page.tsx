"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatEGP, cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import { GlobalPriceAdjuster } from "@/components/inventory/global-price-adjuster";
import { AddCarModal } from "@/components/inventory/add-car-modal";
import type { Car, CarStatus } from "@/lib/types";
import {
  Car as CarIcon,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRole } from "@/hooks/use-role";

export default function InventoryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = createClient();
  const { canChangePrices, canViewPurchasePrice, canViewProfit, canAddCars } =
    useRole();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CarStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showAdjuster, setShowAdjuster] = useState(false);
  const [showAddCar, setShowAddCar] = useState(false);

  const fetchCars = async () => {
    setLoading(true);
    let query = supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    if (search) {
      query = query.or(
        `make.ilike.%${search}%,model.ilike.%${search}%,vin.ilike.%${search}%`,
      );
    }
    const { data } = await query;
    setCars((data as Car[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <CarIcon className="h-7 w-7 text-sky-500" />
            {t("inventory.title")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {cars.length} {t("inventory.title").toLowerCase()}
          </p>
        </div>
        <div className="flex gap-2">
          {canChangePrices && (
            <Button
              variant="outline"
              onClick={() => setShowAdjuster(!showAdjuster)}
            >
              <SlidersHorizontal className="h-4 w-4 me-2" />
              {t("inventory.priceAdjuster")}
            </Button>
          )}
          {canAddCars && (
            <Button variant="primary" onClick={() => setShowAddCar(true)}>
              <Plus className="h-4 w-4 me-2" />
              {t("inventory.addCar")}
            </Button>
          )}
        </div>
      </div>

      {/* Price Adjuster (toggle) */}
      {canChangePrices && showAdjuster && (
        <div className="relative">
          <button
            onClick={() => setShowAdjuster(false)}
            className="absolute top-3 end-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 z-10"
          >
            <X className="h-4 w-4" />
          </button>
          <GlobalPriceAdjuster onComplete={fetchCars} />
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder={`${t("app.search")}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as CarStatus | "all")}
          options={[
            { value: "all", label: t("app.all") },
            { value: "available", label: t("inventory.available") },
            { value: "reserved", label: t("inventory.reserved") },
            { value: "sold", label: t("inventory.sold") },
          ]}
        />
      </div>

      {/* Car Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
        </div>
      ) : cars.length === 0 ? (
        <GlassCard className="text-center py-12">
          <CarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("app.noData")}</p>
        </GlassCard>
      ) : (
        <BentoGrid columns={3}>
          {cars.map((car) => {
            const profit = car.market_price - car.purchase_price;
            const profitPct =
              car.purchase_price > 0
                ? ((profit / car.purchase_price) * 100).toFixed(1)
                : "0";

            return (
              <BentoItem key={car.id}>
                <GlassCard
                  variant="interactive"
                  padding="none"
                  className="cursor-pointer"
                  onClick={() => router.push(`/inventory/${car.id}`)}
                >
                  {/* Car image placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-2xl flex items-center justify-center relative">
                    {car.images?.[0] ? (
                      <Image
                        src={car.images[0]}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-cover rounded-t-2xl"
                      />
                    ) : (
                      <CarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base">
                          {car.make} {car.model}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {car.year} • {car.color || "—"} •{" "}
                          {car.mileage_km?.toLocaleString()} km
                        </p>
                      </div>
                      <StatusBadge
                        status={car.status}
                        label={t(`inventory.${car.status}`)}
                        size="sm"
                      />
                    </div>

                    {/* Pricing */}
                    <div
                      className={cn(
                        "grid gap-2 text-sm",
                        canViewPurchasePrice ? "grid-cols-2" : "grid-cols-1",
                      )}
                    >
                      {canViewPurchasePrice && (
                        <div>
                          <p className="text-xs text-gray-400">
                            {t("inventory.purchasePrice")}
                          </p>
                          <p className="font-semibold">
                            {formatEGP(car.purchase_price)}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400">
                          {t("inventory.marketPrice")}
                        </p>
                        <p className="font-semibold">
                          {formatEGP(car.market_price)}
                        </p>
                      </div>
                    </div>

                    {/* Profit indicator -- admin/manager only */}
                    {canViewProfit && (
                      <div
                        className={cn(
                          "text-xs font-semibold px-2 py-1 rounded-lg text-center",
                          profit >= 0
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red-500/10 text-red-600",
                        )}
                      >
                        {profit >= 0 ? "+" : ""}
                        {formatEGP(profit)} ({profitPct}%)
                      </div>
                    )}
                  </div>
                </GlassCard>
              </BentoItem>
            );
          })}
        </BentoGrid>
      )}

      {/* Add Car Modal */}
      <AddCarModal
        open={showAddCar}
        onClose={() => setShowAddCar(false)}
        onSuccess={fetchCars}
      />
    </div>
  );
}
