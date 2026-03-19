"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { X, Loader2, Camera } from "lucide-react";

interface AddCarModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCarModal({ open, onClose, onSuccess }: AddCarModalProps) {
  const { t } = useTranslation();
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
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
  });
  const [images, setImages] = useState<File[]>([]);

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files).slice(0, 5));
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of images) {
      const ext = file.name.split(".").pop();
      const path = `cars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("car-images")
        .upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("car-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make || !form.model || !form.purchase_price || !form.market_price)
      return;

    setLoading(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }

      const { error } = await supabase.from("cars").insert({
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
        images: imageUrls,
        status: "available",
      });

      if (error) throw error;

      toast(t("app.success"), "success");
      onSuccess();
      onClose();
      // Reset form
      setForm({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        color: "",
        mileage_km: 0,
        condition: "used",
        purchase_price: 0,
        market_price: 0,
        vin: "",
        seller_name: "",
        seller_phone: "",
        seller_national_id: "",
        notes: "",
      });
      setImages([]);
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

        <h2 className="text-xl font-bold mb-4">{t("inventory.addCar")}</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("inventory.make")}
              placeholder="Toyota"
              value={form.make}
              onChange={(e) => updateField("make", e.target.value)}
              required
            />
            <Input
              label={t("inventory.model")}
              placeholder="Corolla"
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label={t("inventory.year")}
              type="number"
              value={form.year}
              onChange={(e) => updateField("year", parseInt(e.target.value))}
              required
            />
            <Input
              label={t("inventory.color")}
              placeholder="White"
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
          </div>

          <Select
            label={t("inventory.condition")}
            value={form.condition}
            onChange={(e) => updateField("condition", e.target.value)}
            options={[
              { value: "used", label: t("inventory.used") },
              { value: "new", label: t("inventory.new") },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("inventory.purchasePrice")}
              type="number"
              value={form.purchase_price || ""}
              onChange={(e) =>
                updateField("purchase_price", parseInt(e.target.value) || 0)
              }
              required
            />
            <Input
              label={t("inventory.marketPrice")}
              type="number"
              value={form.market_price || ""}
              onChange={(e) =>
                updateField("market_price", parseInt(e.target.value) || 0)
              }
              required
            />
          </div>

          <Input
            label={t("inventory.vin")}
            placeholder="Optional"
            value={form.vin}
            onChange={(e) => updateField("vin", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
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

          <Input
            label={t("inventory.sellerNationalId")}
            value={form.seller_national_id}
            onChange={(e) => updateField("seller_national_id", e.target.value)}
          />

          {/* Image upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("inventory.images")}
            </label>
            <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 cursor-pointer hover:border-sky-500 transition-colors">
              <Camera className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                {images.length > 0
                  ? `${images.length} photo(s) selected`
                  : "Upload photos (max 5)"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          <Input
            label={t("inventory.notes")}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t("inventory.addCar")
            )}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
