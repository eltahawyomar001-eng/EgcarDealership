"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { formatEGP, formatDate, cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { BentoGrid, BentoItem } from "@/components/ui/bento-grid";
import type {
  InstallmentSummary,
  InstallmentStatus,
  PaymentMethod,
} from "@/lib/types";
import {
  CalendarCheck,
  DollarSign,
  AlertTriangle,
  Clock,
  Upload,
  Check,
  Camera,
  Receipt,
  X,
  MessageCircle,
} from "lucide-react";

export default function InstallmentsPage() {
  const { t, i18n } = useTranslation();
  const supabase = createClient();

  const [installments, setInstallments] = useState<InstallmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InstallmentStatus | "all">("all");
  const [selectedInstallment, setSelectedInstallment] =
    useState<InstallmentSummary | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    overdue: 0,
    overdueAmount: 0,
    paidThisMonth: 0,
  });

  const fetchInstallments = async () => {
    setLoading(true);
    let query = supabase
      .from("v_installment_summary")
      .select("*")
      .order("due_date", { ascending: true });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setInstallments((data as InstallmentSummary[]) || []);
    setLoading(false);
  };

  const fetchStats = async () => {
    // Overdue count + amount
    const { data: overdueData } = await supabase
      .from("installments")
      .select("amount_due, amount_paid")
      .eq("status", "overdue");
    const overdueAmount =
      overdueData?.reduce(
        (sum, i) => sum + (Number(i.amount_due) - Number(i.amount_paid)),
        0,
      ) || 0;

    // Paid this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { data: paidData } = await supabase
      .from("installments")
      .select("amount_paid")
      .eq("status", "paid")
      .gte("payment_date", startOfMonth.toISOString());
    const paidThisMonth =
      paidData?.reduce((sum, i) => sum + Number(i.amount_paid), 0) || 0;

    // Upcoming
    const { count: upcomingCount } = await supabase
      .from("installments")
      .select("*", { count: "exact", head: true })
      .eq("status", "upcoming");

    setStats({
      total: installments.length,
      upcoming: upcomingCount || 0,
      overdue: overdueData?.length || 0,
      overdueAmount,
      paidThisMonth,
    });
  };

  useEffect(() => {
    fetchInstallments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (installments.length > 0) fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installments]);

  const handleLogPayment = async () => {
    if (!selectedInstallment || !paymentAmount) return;
    setSubmitting(true);

    try {
      let screenshotUrl: string | null = null;

      // Upload screenshot if provided
      if (paymentScreenshot) {
        const fileName = `${selectedInstallment.installment_id}-${Date.now()}.${paymentScreenshot.name.split(".").pop()}`;
        const { data: uploadData } = await supabase.storage
          .from("payment-proofs")
          .upload(fileName, paymentScreenshot);
        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from("payment-proofs")
            .getPublicUrl(fileName);
          screenshotUrl = urlData.publicUrl;
        }
      }

      // Determine new status
      const totalPaid =
        Number(selectedInstallment.amount_paid) + Number(paymentAmount);
      const newStatus: InstallmentStatus =
        totalPaid >= selectedInstallment.amount_due ? "paid" : "partially_paid";

      // Update installment
      await supabase
        .from("installments")
        .update({
          amount_paid: totalPaid,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          payment_reference: paymentRef || null,
          payment_screenshot_url: screenshotUrl,
          status: newStatus,
        })
        .eq("id", selectedInstallment.installment_id);

      setSubmitSuccess(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        setSubmitSuccess(false);
        setSelectedInstallment(null);
        setPaymentAmount("");
        setPaymentRef("");
        setPaymentScreenshot(null);
        fetchInstallments();
      }, 1500);
    } catch (error) {
      console.error("Payment logging error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarCheck className="h-7 w-7 text-sky-500" />
          {t("installments.title")}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {t("installments.schedule")}
        </p>
      </div>

      {/* Stats */}
      <BentoGrid columns={4}>
        <BentoItem>
          <StatCard
            title={t("installments.upcoming")}
            value={stats.upcoming}
            icon={Clock}
            color="sky"
          />
        </BentoItem>
        <BentoItem>
          <StatCard
            title={t("installments.overdue")}
            value={stats.overdue}
            icon={AlertTriangle}
            color={stats.overdue > 0 ? "red" : "emerald"}
          />
        </BentoItem>
        <BentoItem>
          <StatCard
            title={t("installments.overdueAmount")}
            value={formatEGP(stats.overdueAmount)}
            icon={DollarSign}
            color="red"
          />
        </BentoItem>
        <BentoItem>
          <StatCard
            title={t("installments.collectedThisMonth")}
            value={formatEGP(stats.paidThisMonth)}
            icon={Check}
            color="emerald"
          />
        </BentoItem>
      </BentoGrid>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(
          ["all", "overdue", "upcoming", "partially_paid", "paid"] as const
        ).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as InstallmentStatus | "all")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              filter === status
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                : "bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10",
            )}
          >
            {status === "all"
              ? t("app.all")
              : t(
                  `installments.${status === "partially_paid" ? "partiallyPaid" : status}`,
                )}
          </button>
        ))}
      </div>

      {/* Installment List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
        </div>
      ) : installments.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("installments.noUpcoming")}</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {installments.map((inst) => {
            const remaining = inst.amount_due - inst.amount_paid;
            const progressPct =
              inst.amount_due > 0
                ? Math.min(100, (inst.amount_paid / inst.amount_due) * 100)
                : 0;

            return (
              <GlassCard
                key={inst.installment_id}
                variant="interactive"
                className="flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">
                      {inst.buyer_name}
                    </h3>
                    <StatusBadge
                      status={inst.status}
                      label={t(
                        `installments.${inst.status === "partially_paid" ? "partiallyPaid" : inst.status}`,
                      )}
                      size="sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {inst.car_name} • {t("installments.dueDate")}:{" "}
                    {formatDate(inst.due_date, i18n.language)}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{formatEGP(inst.amount_paid)} paid</span>
                      <span>{formatEGP(inst.amount_due)} total</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          inst.status === "paid"
                            ? "bg-emerald-500"
                            : inst.status === "overdue"
                              ? "bg-red-500"
                              : "bg-sky-500",
                        )}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Amount + Action */}
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <div className="text-end">
                    <p
                      className={cn(
                        "font-bold text-lg",
                        inst.status === "overdue" ? "text-red-600" : "",
                      )}
                    >
                      {formatEGP(remaining)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t("installments.remaining")}
                    </p>
                  </div>
                  {inst.status !== "paid" && (
                    <div className="flex items-center gap-2">
                      {inst.buyer_phone && (
                        <a
                          href={`https://wa.me/${inst.buyer_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Hi ${inst.buyer_name}, this is a reminder regarding installment #${inst.installment_number} for ${inst.car_name}. Amount due: ${inst.amount_due - inst.amount_paid} EGP.`,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setSelectedInstallment(inst);
                          setPaymentAmount(String(remaining));
                          setShowPaymentModal(true);
                        }}
                      >
                        {t("installments.logPayment")}
                      </Button>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInstallment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard variant="elevated" className="w-full max-w-md">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              {t("installments.logPayment")}
            </h2>

            <div className="mb-4 p-3 rounded-xl bg-gray-100/50 dark:bg-white/5">
              <p className="font-medium text-sm">
                {selectedInstallment.buyer_name}
              </p>
              <p className="text-xs text-gray-500">
                {selectedInstallment.car_name} • #
                {selectedInstallment.installment_number}
              </p>
              <p className="text-sm font-semibold mt-1">
                Due:{" "}
                {formatEGP(
                  selectedInstallment.amount_due -
                    selectedInstallment.amount_paid,
                )}
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label={t("installments.amountPaid") + " (EGP)"}
                type="number"
                min="0"
                max={String(
                  selectedInstallment.amount_due -
                    selectedInstallment.amount_paid,
                )}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />

              <Select
                label={t("installments.paymentMethod")}
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                options={[
                  { value: "cash", label: t("installments.cashPayment") },
                  {
                    value: "vodafone_cash",
                    label: t("installments.vodafoneCash"),
                  },
                  { value: "instapay", label: t("installments.instapay") },
                  {
                    value: "bank_transfer",
                    label: t("installments.bankTransfer"),
                  },
                  { value: "other", label: t("installments.other") },
                ]}
              />

              <Input
                label={t("installments.paymentRef")}
                placeholder="TXN-123456"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />

              {/* Screenshot upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("installments.uploadScreenshot")}
                </label>
                <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-4 text-center">
                  {paymentScreenshot ? (
                    <div className="flex items-center gap-2 justify-center">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-emerald-600">
                        {paymentScreenshot.name}
                      </span>
                      <button
                        onClick={() => setPaymentScreenshot(null)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Camera className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">
                        {t("installments.screenshotHint")}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setPaymentScreenshot(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedInstallment(null);
                  }}
                >
                  {t("app.cancel")}
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleLogPayment}
                  disabled={submitting || !paymentAmount || submitSuccess}
                >
                  {submitSuccess ? (
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4" /> {t("app.success")}
                    </span>
                  ) : submitting ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" /> {t("app.confirm")}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
