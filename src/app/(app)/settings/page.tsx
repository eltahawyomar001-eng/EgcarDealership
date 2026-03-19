"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { usePWAContext } from "@/components/providers/pwa-provider";
import {
  hasPlatformAuthenticator,
  enrollBiometric,
  removeBiometric,
  isEnrolled,
} from "@/lib/pwa/biometric";
import { localeDirection, localeNames, type Locale } from "@/lib/i18n/config";
import {
  Settings as SettingsIcon,
  Globe,
  Building2,
  Loader2,
  Wifi,
  Fingerprint,
  Shield,
  CheckCircle,
} from "lucide-react";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { tenant } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();
  const { dataSaverEnabled, toggleDataSaver } = usePWAContext();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [saving, setSaving] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Controlled form state
  const [dealershipName, setDealershipName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (tenant) {
      setDealershipName(tenant.name || "");
      setPhone(tenant.phone || "");
      setAddress(tenant.address || "");
    }
  }, [tenant]);

  useEffect(() => {
    hasPlatformAuthenticator().then(setBiometricAvailable);
    setBiometricEnabled(isEnrolled());
  }, []);

  useEffect(() => {
    document.documentElement.dir =
      localeDirection[currentLang as Locale] || "ltr";
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const changeLanguage = useCallback(
    (lang: string) => {
      i18n.changeLanguage(lang);
      setCurrentLang(lang);
    },
    [i18n],
  );

  const handleBiometricToggle = async () => {
    setBiometricLoading(true);
    try {
      if (biometricEnabled) {
        removeBiometric();
        setBiometricEnabled(false);
        toast(t("app.success"), "success");
      } else {
        const userId = tenant?.id || "user";
        const success = await enrollBiometric(userId, t("app.name"));
        if (success) {
          setBiometricEnabled(true);
          toast(t("app.success"), "success");
        } else {
          toast(t("app.error"), "error");
        }
      }
    } catch {
      toast(t("app.error"), "error");
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          name: dealershipName,
          phone,
          address,
        })
        .eq("id", tenant.id);
      if (error) throw error;
      toast(t("app.success"), "success");
    } catch {
      toast(t("app.error"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-7 w-7 text-sky-500" />
          {t("settings.title")}
        </h1>
      </div>

      {/* Language */}
      <GlassCard variant="elevated">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-5 w-5 text-sky-500" />
          <h2 className="font-bold">{t("settings.language")}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(localeNames) as [Locale, string][]).map(
            ([code, name]) => (
              <button
                key={code}
                onClick={() => changeLanguage(code)}
                className={`p-3 rounded-xl border-2 text-center font-semibold transition-all ${
                  i18n.language === code
                    ? "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-400"
                    : "border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300"
                }`}
              >
                {name}
              </button>
            ),
          )}
        </div>
      </GlassCard>

      {/* Dealership Info */}
      <GlassCard variant="elevated">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-sky-500" />
          <h2 className="font-bold">{t("settings.dealershipName")}</h2>
        </div>
        <div className="space-y-3">
          <Input
            label={t("settings.dealershipName")}
            value={dealershipName}
            onChange={(e) => setDealershipName(e.target.value)}
          />
          <Input
            label={t("settings.phone")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label={t("settings.address")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Button
            variant="primary"
            className="w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t("app.save")
            )}
          </Button>
        </div>
      </GlassCard>

      {/* Data Saver Mode */}
      <GlassCard variant="elevated">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15">
              <Wifi className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-bold">{t("pwa.dataSaverMode")}</h2>
              <p className="text-sm text-gray-500">
                {t("pwa.dataSaverDescription")}
              </p>
            </div>
          </div>
          <button
            onClick={toggleDataSaver}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              dataSaverEnabled ? "bg-sky-500" : "bg-gray-300 dark:bg-white/15"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                dataSaverEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </GlassCard>

      {/* Biometric Lock */}
      {biometricAvailable && (
        <GlassCard variant="elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-violet-500/15">
              <Fingerprint className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h2 className="font-bold">{t("pwa.biometricLock")}</h2>
              <p className="text-sm text-gray-500">
                {t("pwa.biometricDescription")}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {biometricEnabled ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    {t("pwa.biometricEnabled")}
                  </span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {t("pwa.biometricDisabled")}
                  </span>
                </>
              )}
            </div>
            <Button
              variant={biometricEnabled ? "ghost" : "primary"}
              size="sm"
              onClick={handleBiometricToggle}
              disabled={biometricLoading}
            >
              {biometricLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : biometricEnabled ? (
                t("pwa.disableBiometric")
              ) : (
                t("pwa.enableBiometric")
              )}
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
