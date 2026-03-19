"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import {
  Car,
  Eye,
  ShieldCheck,
  MapPin,
  CreditCard,
  ArrowRight,
  ChevronRight,
  Building2,
  BarChart3,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Eye,
      title: t("landing.featureOversight"),
      description: t("landing.featureOversightDesc"),
      color: "sky",
    },
    {
      icon: ShieldCheck,
      title: t("landing.featureProfit"),
      description: t("landing.featureProfitDesc"),
      color: "emerald",
    },
    {
      icon: MapPin,
      title: t("landing.featureWorkforce"),
      description: t("landing.featureWorkforceDesc"),
      color: "violet",
    },
    {
      icon: CreditCard,
      title: t("landing.featureInstallments"),
      description: t("landing.featureInstallmentsDesc"),
      color: "amber",
    },
  ];

  const stats = [
    { value: "50+", label: t("landing.statDealerships") },
    { value: "2,400+", label: t("landing.statCarsTracked") },
    { value: "12M+", label: t("landing.statCollected") },
    { value: "99.9%", label: t("landing.statUptime") },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    sky: { bg: "bg-sky-500/15", text: "text-sky-500" },
    emerald: { bg: "bg-emerald-500/15", text: "text-emerald-500" },
    violet: { bg: "bg-violet-500/15", text: "text-violet-500" },
    amber: { bg: "bg-amber-500/15", text: "text-amber-500" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-sky-50/20 to-gray-50 dark:from-gray-950 dark:via-sky-950/10 dark:to-gray-950">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-sky-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">CarOS Egypt</span>
        </div>
        <Link href="/login">
          <Button variant="outline" size="md">
            {t("auth.login")}
            <ChevronRight className="h-4 w-4 ms-1" />
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-sm font-medium mb-8">
          <Zap className="h-4 w-4" />
          {t("landing.statsTitle")}
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto">
          {t("landing.heroTitle")}
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {t("landing.heroSubtitle")}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button
              variant="primary"
              size="lg"
              className="touch-target gap-2 text-base px-8"
            >
              {t("landing.ctaStart")}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="lg"
            className="touch-target gap-2 text-base text-gray-600 dark:text-gray-300"
          >
            <BarChart3 className="h-5 w-5" />
            {t("landing.ctaDemo")}
          </Button>
        </div>
      </section>

      {/* Features -- Bento Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feature) => {
            const colors = colorMap[feature.color];
            return (
              <GlassCard
                key={feature.title}
                variant="interactive"
                padding="lg"
                className="group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-2xl ${colors.bg} shrink-0 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className={`h-6 w-6 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <GlassCard variant="elevated" padding="lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-black text-sky-500">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-gray-400" />
          <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">
            {t("landing.socialProof")}
          </p>
        </div>
        {/* Placeholder logos for social proof */}
        <div className="flex items-center justify-center gap-8 opacity-30">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-20 bg-gray-400 dark:bg-gray-600 rounded-lg"
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <GlassCard
          variant="elevated"
          padding="lg"
          className="text-center bg-gradient-to-r from-sky-500/10 via-transparent to-violet-500/10"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {t("landing.heroTitle")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            {t("landing.heroSubtitle")}
          </p>
          <Link href="/login">
            <Button
              variant="primary"
              size="lg"
              className="touch-target gap-2 text-base px-8"
            >
              {t("landing.ctaStart")}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200/50 dark:border-white/5 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Car className="h-4 w-4 text-sky-500" />
          <span className="text-sm font-semibold">CarOS Egypt</span>
        </div>
        <p className="text-xs text-gray-400">{t("landing.footerTagline")}</p>
        <p className="text-xs text-gray-400 mt-1">
          &copy; {new Date().getFullYear()} CarOS Egypt
        </p>
      </footer>
    </div>
  );
}
