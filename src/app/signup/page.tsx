"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/providers/auth-provider";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Car,
  Shield,
  Building2,
  User,
  Phone,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function SignupPage() {
  const { t } = useTranslation();
  const { signUp } = useAuth();

  const [dealershipName, setDealershipName] = useState("");
  const [dealershipNameAr, setDealershipNameAr] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealershipName || !fullName || !email || !password) return;

    setLoading(true);
    setError(null);

    const result = await signUp({
      email,
      password,
      fullName,
      dealershipName,
      dealershipNameAr: dealershipNameAr || undefined,
      phone: phone || undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-sky-50/30 to-gray-50 dark:from-gray-950 dark:via-sky-950/10 dark:to-gray-950">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <GlassCard variant="elevated" className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-sky-500/25">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CarOS Egypt</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("auth.signupSubtitle")}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Dealership Name */}
          <Input
            label={t("auth.dealershipName")}
            placeholder={t("auth.dealershipNamePlaceholder")}
            value={dealershipName}
            onChange={(e) => setDealershipName(e.target.value)}
            icon={<Building2 className="h-4 w-4" />}
            required
          />

          {/* Dealership Name Arabic (optional) */}
          <Input
            label={t("auth.dealershipNameAr")}
            placeholder={t("auth.dealershipNameArPlaceholder")}
            value={dealershipNameAr}
            onChange={(e) => setDealershipNameAr(e.target.value)}
            dir="rtl"
          />

          {/* Owner Name */}
          <Input
            label={t("auth.ownerName")}
            placeholder={t("auth.ownerNamePlaceholder")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={<User className="h-4 w-4" />}
            required
          />

          {/* Phone */}
          <Input
            label={t("auth.phone")}
            placeholder="+20 10x xxx xxxx"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<Phone className="h-4 w-4" />}
          />

          {/* Email */}
          <Input
            label={t("auth.email")}
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="h-4 w-4" />}
            required
          />

          {/* Password */}
          <Input
            label={t("auth.password")}
            placeholder={t("auth.passwordPlaceholder")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="h-4 w-4" />}
            required
            minLength={6}
          />

          <Button
            variant="primary"
            size="lg"
            className="w-full touch-target"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t("auth.createAccount")
            )}
          </Button>
        </form>

        {/* Switch to Login */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            {t("auth.haveAccount")}{" "}
            <Link
              href="/login"
              className="text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              {t("auth.login")}
            </Link>
          </p>
        </div>

        {/* Terms notice */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Shield className="h-3.5 w-3.5 text-gray-400" />
          <p className="text-xs text-gray-400">{t("auth.termsNotice")}</p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-3">
          &copy; {new Date().getFullYear()} CarOS Egypt
        </p>
      </GlassCard>
    </div>
  );
}
