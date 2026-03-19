"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatEGP } from "@/lib/utils";
import type { AdjustmentType, AdjustmentScope } from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calculator,
  Check,
} from "lucide-react";

interface PriceAdjusterProps {
  /** If provided, only adjust this single car */
  carId?: string;
  /** Callback after successful adjustment */
  onComplete?: () => void;
}

export function GlobalPriceAdjuster({ carId, onComplete }: PriceAdjusterProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const supabase = createClient();

  const [adjustmentType, setAdjustmentType] =
    useState<AdjustmentType>("percentage");
  const [adjustmentValue, setAdjustmentValue] = useState("");
  const [direction, setDirection] = useState<"increase" | "decrease">(
    "increase",
  );
  const [scope, setScope] = useState<AdjustmentScope>(carId ? "single" : "all");
  const [filterMake, setFilterMake] = useState("");
  const [filterModel, setFilterModel] = useState("");

  const [preview, setPreview] = useState<{
    count: number;
    totalBefore: number;
    totalAfter: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [makes, setMakes] = useState<string[]>([]);

  // Fetch unique makes for filter
  useEffect(() => {
    async function fetchMakes() {
      const { data } = await supabase
        .from("cars")
        .select("make")
        .eq("status", "available");
      if (data) {
        const uniqueMakes = [...new Set(data.map((c) => c.make))];
        setMakes(uniqueMakes);
      }
    }
    if (!carId) fetchMakes();
  }, [supabase, carId]);

  // Preview calculation
  const calculatePreview = async () => {
    const value = parseFloat(adjustmentValue);
    if (isNaN(value) || value <= 0) return;

    let query = supabase
      .from("cars")
      .select("market_price")
      .eq("status", "available");

    if (carId) {
      query = query.eq("id", carId);
    } else if (scope === "filtered") {
      if (filterMake) query = query.eq("make", filterMake);
      if (filterModel) query = query.ilike("model", `%${filterModel}%`);
    }

    const { data: cars } = await query;
    if (!cars || cars.length === 0) {
      setPreview(null);
      return;
    }

    const totalBefore = cars.reduce(
      (sum, c) => sum + Number(c.market_price),
      0,
    );
    let totalAfter = 0;

    cars.forEach((car) => {
      const price = Number(car.market_price);
      let newPrice: number;
      if (adjustmentType === "percentage") {
        const factor =
          direction === "increase" ? 1 + value / 100 : 1 - value / 100;
        newPrice = Math.round(price * factor);
      } else {
        newPrice = direction === "increase" ? price + value : price - value;
      }
      totalAfter += Math.max(0, newPrice);
    });

    setPreview({
      count: cars.length,
      totalBefore,
      totalAfter,
    });
  };

  // Apply adjustment
  const applyAdjustment = async () => {
    const value = parseFloat(adjustmentValue);
    if (isNaN(value) || value <= 0 || !preview) return;

    setLoading(true);
    try {
      // Build filter
      let query = supabase
        .from("cars")
        .select("id, market_price")
        .eq("status", "available");

      if (carId) {
        query = query.eq("id", carId);
      } else if (scope === "filtered") {
        if (filterMake) query = query.eq("make", filterMake);
        if (filterModel) query = query.ilike("model", `%${filterModel}%`);
      }

      const { data: cars } = await query;
      if (!cars) throw new Error("No cars found");

      // Update each car's market_price
      for (const car of cars) {
        const price = Number(car.market_price);
        let newPrice: number;
        if (adjustmentType === "percentage") {
          const factor =
            direction === "increase" ? 1 + value / 100 : 1 - value / 100;
          newPrice = Math.round(price * factor);
        } else {
          newPrice = direction === "increase" ? price + value : price - value;
        }
        newPrice = Math.max(0, newPrice);

        await supabase
          .from("cars")
          .update({ market_price: newPrice })
          .eq("id", car.id);
      }

      // Log adjustment
      await supabase.from("price_adjustments").insert({
        adjustment_type: adjustmentType,
        adjustment_value: direction === "decrease" ? -value : value,
        scope: carId ? "single" : scope,
        car_id: carId || null,
        filter_make: filterMake || null,
        filter_model: filterModel || null,
        cars_affected: preview.count,
        total_before: preview.totalBefore,
        total_after: preview.totalAfter,
        applied_by: user?.id,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPreview(null);
        setAdjustmentValue("");
        onComplete?.();
      }, 2000);
    } catch (error) {
      console.error("Price adjustment error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard variant="elevated" className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-amber-500/15">
          <Calculator className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("inventory.priceAdjuster")}</h2>
          <p className="text-xs text-gray-500">
            {t("inventory.adjustWarning")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Direction */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDirection("increase")}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
              direction === "increase"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                : "border-gray-200 dark:border-white/10 text-gray-500"
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="font-semibold">{t("inventory.increase")}</span>
          </button>
          <button
            onClick={() => setDirection("decrease")}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
              direction === "decrease"
                ? "border-red-500 bg-red-500/10 text-red-700"
                : "border-gray-200 dark:border-white/10 text-gray-500"
            }`}
          >
            <TrendingDown className="h-5 w-5" />
            <span className="font-semibold">{t("inventory.decrease")}</span>
          </button>
        </div>

        {/* Type + Value */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t("inventory.adjustBy")}
            value={adjustmentType}
            onChange={(e) =>
              setAdjustmentType(e.target.value as AdjustmentType)
            }
            options={[
              { value: "percentage", label: t("inventory.percentage") },
              { value: "fixed", label: t("inventory.fixedAmount") },
            ]}
          />
          <Input
            label={adjustmentType === "percentage" ? "%" : "EGP"}
            type="number"
            min="0"
            step={adjustmentType === "percentage" ? "0.5" : "1000"}
            placeholder={adjustmentType === "percentage" ? "5" : "10000"}
            value={adjustmentValue}
            onChange={(e) => setAdjustmentValue(e.target.value)}
          />
        </div>

        {/* Scope (hide for single car) */}
        {!carId && (
          <div className="space-y-3">
            <Select
              label="Scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as AdjustmentScope)}
              options={[
                { value: "all", label: t("inventory.applyToAll") },
                { value: "filtered", label: t("inventory.applyFiltered") },
              ]}
            />
            {scope === "filtered" && (
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label={t("inventory.make")}
                  value={filterMake}
                  onChange={(e) => setFilterMake(e.target.value)}
                  options={[
                    { value: "", label: t("app.all") },
                    ...makes.map((m) => ({ value: m, label: m })),
                  ]}
                />
                <Input
                  label={t("inventory.model")}
                  placeholder="Corolla, Civic..."
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* Preview Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={calculatePreview}
          disabled={!adjustmentValue || parseFloat(adjustmentValue) <= 0}
        >
          <Calculator className="h-4 w-4 me-2" />
          {t("inventory.previewChanges")}
        </Button>

        {/* Preview Results */}
        {preview && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {t("inventory.carsAffected", { count: preview.count })}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">{t("inventory.before")}</p>
                <p className="font-bold text-lg">
                  {formatEGP(preview.totalBefore)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">{t("inventory.after")}</p>
                <p
                  className={`font-bold text-lg ${
                    preview.totalAfter > preview.totalBefore
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {formatEGP(preview.totalAfter)}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {t("inventory.difference")}:{" "}
              {formatEGP(Math.abs(preview.totalAfter - preview.totalBefore))}
              {preview.totalAfter !== preview.totalBefore &&
                ` (${preview.totalAfter > preview.totalBefore ? "+" : "-"}${(
                  (Math.abs(preview.totalAfter - preview.totalBefore) /
                    preview.totalBefore) *
                  100
                ).toFixed(1)}%)`}
            </div>
          </div>
        )}

        {/* Apply Button */}
        {preview && (
          <Button
            variant={direction === "increase" ? "primary" : "danger"}
            className="w-full"
            onClick={applyAdjustment}
            disabled={loading || success}
          >
            {success ? (
              <>
                <Check className="h-4 w-4 me-2" />
                Applied Successfully!
              </>
            ) : loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>{t("inventory.confirmAdjust")}</>
            )}
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
