"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { formatEGP } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { Car } from "@/lib/types";
import { X, Loader2, Car as CarIcon } from "lucide-react";

interface NewSaleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewSaleModal({ open, onClose, onSuccess }: NewSaleModalProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [step, setStep] = useState(1); // 1: pick car, 2: buyer info, 3: payment

  const [form, setForm] = useState({
    car_id: "",
    buyer_name: "",
    buyer_phone: "",
    buyer_national_id: "",
    buyer_address: "",
    sale_type: "cash" as "cash" | "installment",
    sale_price: 0,
    down_payment: 0,
    num_installments: 12,
  });

  const selectedCar = availableCars.find((c) => c.id === form.car_id);

  useEffect(() => {
    if (open) {
      supabase
        .from("cars")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .then(({ data }) => setAvailableCars((data as Car[]) || []));
    }
  }, [open, supabase]);

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const remaining = form.sale_price - form.down_payment;
  const installmentAmount =
    form.num_installments > 0
      ? Math.ceil(remaining / form.num_installments)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.car_id || !form.buyer_name || !form.sale_price) return;

    setLoading(true);
    try {
      // 1. Create sale
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          car_id: form.car_id,
          buyer_name: form.buyer_name,
          buyer_phone: form.buyer_phone || null,
          buyer_national_id: form.buyer_national_id || null,
          buyer_address: form.buyer_address || null,
          sale_type: form.sale_type,
          sale_price: form.sale_price,
          down_payment:
            form.sale_type === "cash" ? form.sale_price : form.down_payment,
          remaining_amount: form.sale_type === "cash" ? 0 : remaining,
          status: "completed",
          sold_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Update car status to sold
      await supabase
        .from("cars")
        .update({ status: "sold" })
        .eq("id", form.car_id);

      // 3. If installment, create installment schedule
      if (form.sale_type === "installment" && sale) {
        const installments = [];
        const today = new Date();
        for (let i = 1; i <= form.num_installments; i++) {
          const dueDate = new Date(today);
          dueDate.setMonth(dueDate.getMonth() + i);
          installments.push({
            sale_id: sale.id,
            installment_number: i,
            due_date: dueDate.toISOString().split("T")[0],
            amount_due:
              i === form.num_installments
                ? remaining - installmentAmount * (form.num_installments - 1)
                : installmentAmount,
            amount_paid: 0,
            status: "upcoming" as const,
          });
        }
        const { error: instError } = await supabase
          .from("installments")
          .insert(installments);
        if (instError) throw instError;
      }

      toast(t("app.success"), "success");
      onSuccess();
      onClose();
      // Reset
      setForm({
        car_id: "",
        buyer_name: "",
        buyer_phone: "",
        buyer_national_id: "",
        buyer_address: "",
        sale_type: "cash",
        sale_price: 0,
        down_payment: 0,
        num_installments: 12,
      });
      setStep(1);
    } catch {
      toast(t("app.error"), "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <GlassCard
        variant="elevated"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">{t("sales.newSale")}</h2>

        {/* Step indicators */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full ${
                s <= step ? "bg-sky-500" : "bg-gray-200 dark:bg-white/10"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Pick car */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 font-medium">
                {t("sales.selectCar")}
              </p>
              {availableCars.length === 0 ? (
                <div className="text-center py-8">
                  <CarIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{t("app.noData")}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableCars.map((car) => (
                    <button
                      type="button"
                      key={car.id}
                      onClick={() => {
                        updateField("car_id", car.id);
                        updateField("sale_price", car.market_price);
                        setStep(2);
                      }}
                      className={`w-full text-start p-3 rounded-xl border-2 transition-all ${
                        form.car_id === car.id
                          ? "border-sky-500 bg-sky-500/5"
                          : "border-gray-200 dark:border-white/10 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sm">
                            {car.make} {car.model} {car.year}
                          </p>
                          <p className="text-xs text-gray-500">
                            {car.color || "—"} •{" "}
                            {car.mileage_km?.toLocaleString()} km
                          </p>
                        </div>
                        <p className="font-bold text-sm text-sky-600">
                          {formatEGP(car.market_price)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Buyer info */}
          {step === 2 && (
            <div className="space-y-3">
              {selectedCar && (
                <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 text-sm">
                  <span className="font-semibold">
                    {selectedCar.make} {selectedCar.model} {selectedCar.year}
                  </span>{" "}
                  — {formatEGP(selectedCar.market_price)}
                </div>
              )}
              <Input
                label={t("sales.buyerName")}
                value={form.buyer_name}
                onChange={(e) => updateField("buyer_name", e.target.value)}
                required
              />
              <Input
                label={t("sales.buyerPhone")}
                value={form.buyer_phone}
                onChange={(e) => updateField("buyer_phone", e.target.value)}
              />
              <Input
                label={t("sales.buyerNationalId")}
                value={form.buyer_national_id}
                onChange={(e) =>
                  updateField("buyer_national_id", e.target.value)
                }
              />
              <Input
                label={t("sales.buyerAddress")}
                value={form.buyer_address}
                onChange={(e) => updateField("buyer_address", e.target.value)}
              />
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  {t("app.back")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setStep(3)}
                  className="flex-1"
                  disabled={!form.buyer_name}
                >
                  {t("app.next")}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="space-y-3">
              <Select
                label={t("sales.saleType")}
                value={form.sale_type}
                onChange={(e) => updateField("sale_type", e.target.value)}
                options={[
                  { value: "cash", label: t("sales.cash") },
                  { value: "installment", label: t("sales.installment") },
                ]}
              />

              <Input
                label={t("sales.salePrice")}
                type="number"
                value={form.sale_price || ""}
                onChange={(e) =>
                  updateField("sale_price", parseInt(e.target.value) || 0)
                }
                required
              />

              {form.sale_type === "installment" && (
                <>
                  <Input
                    label={t("sales.downPayment")}
                    type="number"
                    value={form.down_payment || ""}
                    onChange={(e) =>
                      updateField("down_payment", parseInt(e.target.value) || 0)
                    }
                  />
                  <Input
                    label={t("sales.numberOfInstallments")}
                    type="number"
                    value={form.num_installments}
                    onChange={(e) =>
                      updateField(
                        "num_installments",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    min={1}
                    max={60}
                  />
                  {/* Preview */}
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {t("sales.remaining")}
                      </span>
                      <span className="font-semibold">
                        {formatEGP(remaining)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {t("sales.monthlyInstallment")}
                      </span>
                      <span className="font-semibold">
                        {formatEGP(installmentAmount)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Profit preview */}
              {selectedCar && (
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("sales.profit")}</span>
                    <span className="font-bold text-emerald-600">
                      {formatEGP(form.sale_price - selectedCar.purchase_price)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  {t("app.back")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    t("app.confirm")
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </GlassCard>
    </div>
  );
}
