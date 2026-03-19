"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatEGP, cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { Car, CarStatus } from "@/lib/types";
import {
  ArrowLeft,
  Car as CarIcon,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";

export default function CarDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const { toast } = useToast();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: 2024,
    color: "",
    mileage_km: 0,
    condition: "used" as "new" | "used",
    purchase_price: 0,
    market_price: 0,
    vin: "",
    seller_name: "",
    seller_phone: "",
    seller_national_id: "",
    notes: "",
    status: "available" as CarStatus,
  });

  useEffect(() => {
    async function fetchCar() {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", params.id as string)
        .single();
      if (error || !data) {
        router.push("/inventory");
        return;
      }
      const carData = data as Car;
      setCar(carData);
      setForm({
        make: carData.make,
        model: carData.model,
        year: carData.year,
        color: carData.color || "",
        mileage_km: carData.mileage_km || 0,
        condition: carData.condition,
        purchase_price: carData.purchase_price,
        market_price: carData.market_price,
        vin: carData.vin || "",
        seller_name: carData.seller_name || "",
        seller_phone: carData.seller_phone || "",
        seller_national_id: carData.seller_national_id || "",
        notes: carData.notes || "",
        status: carData.status,
      });
      setLoading(false);
    }
    fetchCar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!car) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("cars")
        .update({
          make: form.make,
          model: form.model,
          year: form.year,
          color: form.color || null,
          mileage_km: form.mileage_km,
          condition: form.condition,
          purchase_price: form.purchase_price,
          market_price: form.market_price,
          vin: form.vin || null,
          seller_name: form.seller_name || null,
          seller_phone: form.seller_phone || null,
          seller_national_id: form.seller_national_id || null,
          notes: form.notes || null,
          status: form.status,
        })
        .eq("id", car.id);
      if (error) throw error;
      setCar({ ...car, ...form });
      setEditing(false);
      toast(t("app.success"), "success");
    } catch {
      toast(t("app.error"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!car || !confirm(t("app.delete") + "?")) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("cars").delete().eq("id", car.id);
      if (error) throw error;
      toast(t("app.success"), "success");
      router.push("/inventory");
    } catch {
      toast(t("app.error"), "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!car) return null;

  const profit = car.market_price - car.purchase_price;
  const profitPct =
    car.purchase_price > 0
      ? ((profit / car.purchase_price) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/inventory")}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {car.make} {car.model} {car.year}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge
                status={car.status}
                label={t(`inventory.${car.status}`)}
                size="sm"
              />
              {car.vin && (
                <span className="text-xs text-gray-400">VIN: {car.vin}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit3 className="h-4 w-4 me-2" />
                {t("app.edit")}
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 me-2" />
                    {t("app.delete")}
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 me-2" />
                {t("app.cancel")}
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 me-2" />
                    {t("app.save")}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Car Images */}
      {car.images && car.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {car.images.map((img, i) => (
            <div
              key={i}
              className="aspect-video relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800"
            >
              <Image
                src={img}
                alt={`${car.make} ${car.model} ${i + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {!car.images?.length && (
        <div className="aspect-video max-h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center">
          <CarIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
        </div>
      )}

      {/* Details */}
      {editing ? (
        <GlassCard variant="elevated">
          <h2 className="font-bold text-lg mb-4">{t("app.edit")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t("inventory.make")}
              value={form.make}
              onChange={(e) => updateField("make", e.target.value)}
            />
            <Input
              label={t("inventory.model")}
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
            />
            <Input
              label={t("inventory.year")}
              type="number"
              value={form.year}
              onChange={(e) =>
                updateField("year", parseInt(e.target.value) || 2024)
              }
            />
            <Input
              label={t("inventory.color")}
              value={form.color}
              onChange={(e) => updateField("color", e.target.value)}
            />
            <Input
              label={t("inventory.mileage")}
              type="number"
              value={form.mileage_km}
              onChange={(e) =>
                updateField("mileage_km", parseInt(e.target.value) || 0)
              }
            />
            <Select
              label={t("inventory.condition")}
              value={form.condition}
              onChange={(e) => updateField("condition", e.target.value)}
              options={[
                { value: "new", label: t("inventory.new") },
                { value: "used", label: t("inventory.used") },
              ]}
            />
            <Input
              label={t("inventory.purchasePrice")}
              type="number"
              value={form.purchase_price}
              onChange={(e) =>
                updateField("purchase_price", parseInt(e.target.value) || 0)
              }
            />
            <Input
              label={t("inventory.marketPrice")}
              type="number"
              value={form.market_price}
              onChange={(e) =>
                updateField("market_price", parseInt(e.target.value) || 0)
              }
            />
            <Select
              label={t("inventory.status")}
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              options={[
                { value: "available", label: t("inventory.available") },
                { value: "reserved", label: t("inventory.reserved") },
                { value: "sold", label: t("inventory.sold") },
              ]}
            />
            <Input
              label={t("inventory.vin")}
              value={form.vin}
              onChange={(e) => updateField("vin", e.target.value)}
            />
            <Input
              label={t("inventory.sellerName")}
              value={form.seller_name}
              onChange={(e) => updateField("seller_name", e.target.value)}
            />
            <Input
              label={t("inventory.sellerPhone")}
              value={form.seller_phone}
              onChange={(e) => updateField("seller_phone", e.target.value)}
            />
          </div>
          <div className="mt-4">
            <Input
              label={t("inventory.notes")}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pricing Card */}
          <GlassCard variant="elevated">
            <h3 className="font-bold text-sm text-gray-500 mb-3">
              {t("sales.salePrice")}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">
                  {t("inventory.purchasePrice")}
                </span>
                <span className="font-semibold">
                  {formatEGP(car.purchase_price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">
                  {t("inventory.marketPrice")}
                </span>
                <span className="font-semibold">
                  {formatEGP(car.market_price)}
                </span>
              </div>
              <div className="border-t border-gray-200/50 dark:border-white/10 pt-3 flex justify-between">
                <span className="text-gray-500 text-sm">
                  {t("sales.profit")}
                </span>
                <span
                  className={cn(
                    "font-bold",
                    profit >= 0 ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {profit >= 0 ? "+" : ""}
                  {formatEGP(profit)} ({profitPct}%)
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Car Info Card */}
          <GlassCard variant="elevated">
            <h3 className="font-bold text-sm text-gray-500 mb-3">
              {t("inventory.title")}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {t("inventory.condition")}
                </span>
                <span className="font-medium">
                  {t(`inventory.${car.condition}`)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("inventory.color")}</span>
                <span className="font-medium">{car.color || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("inventory.mileage")}</span>
                <span className="font-medium">
                  {car.mileage_km?.toLocaleString()} km
                </span>
              </div>
              {car.vin && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("inventory.vin")}</span>
                  <span className="font-mono text-xs">{car.vin}</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Seller Info Card */}
          {(car.seller_name || car.seller_phone) && (
            <GlassCard variant="elevated" className="md:col-span-2">
              <h3 className="font-bold text-sm text-gray-500 mb-3">
                {t("inventory.sellerName")}
              </h3>
              <div className="flex items-center justify-between">
                <div className="space-y-1 text-sm">
                  {car.seller_name && (
                    <p className="font-medium">{car.seller_name}</p>
                  )}
                  {car.seller_phone && (
                    <p className="text-gray-500">{car.seller_phone}</p>
                  )}
                  {car.seller_national_id && (
                    <p className="text-xs text-gray-400">
                      ID: {car.seller_national_id}
                    </p>
                  )}
                </div>
                {car.seller_phone && (
                  <a
                    href={`https://wa.me/${car.seller_phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
              </div>
            </GlassCard>
          )}

          {/* Notes */}
          {car.notes && (
            <GlassCard variant="elevated" className="md:col-span-2">
              <h3 className="font-bold text-sm text-gray-500 mb-2">
                {t("inventory.notes")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {car.notes}
              </p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
