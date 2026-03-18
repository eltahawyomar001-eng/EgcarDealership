"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { formatDateTime, cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Attendance } from "@/lib/types";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Loader2,
  Navigation,
  AlertCircle,
  Shield,
} from "lucide-react";

interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function AttendancePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const supabase = createClient();

  const [gpsPosition, setGpsPosition] = useState<GpsPosition | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [todayRecords, setTodayRecords] = useState<Attendance[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastAction, setLastAction] = useState<"clock_in" | "clock_out" | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Fetch today's records
  const fetchTodayRecords = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", user?.id)
      .gte("timestamp", today.toISOString())
      .order("timestamp", { ascending: false });

    const records = (data as Attendance[]) || [];
    setTodayRecords(records);
    if (records.length > 0) {
      setLastAction(records[0].event_type);
    }
    setLoading(false);
  }, [supabase, user?.id]);

  useEffect(() => {
    if (user?.id) fetchTodayRecords();
  }, [user?.id, fetchTodayRecords]);

  // Request GPS
  const requestGPS = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported by your browser");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setGpsLoading(false);
      },
      (error) => {
        setGpsError(
          error.code === 1
            ? "Location permission denied. Please enable GPS."
            : error.code === 2
              ? "Location unavailable. Please try again."
              : "Location request timed out. Please try again.",
        );
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  // Submit attendance
  const submitAttendance = async (eventType: "clock_in" | "clock_out") => {
    if (!gpsPosition || !user) return;
    setSubmitting(true);

    try {
      await supabase.from("attendance").insert({
        user_id: user.id,
        event_type: eventType,
        latitude: gpsPosition.latitude,
        longitude: gpsPosition.longitude,
        accuracy_meters: gpsPosition.accuracy,
        device_info: navigator.userAgent.substring(0, 200),
      });

      setSuccess(true);
      setLastAction(eventType);
      setTimeout(() => {
        setSuccess(false);
        setGpsPosition(null);
        fetchTodayRecords();
      }, 2000);
    } catch (error) {
      console.error("Attendance error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const canClockIn = lastAction !== "clock_in";
  const canClockOut = lastAction === "clock_in";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <MapPin className="h-7 w-7 text-sky-500" />
          {t("attendance.title")}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {t("attendance.gpsRequired")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* GPS Capture Card */}
        <GlassCard variant="elevated" className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-sky-500/15">
              <Navigation className="h-6 w-6 text-sky-500" />
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {canClockIn
                  ? t("attendance.clockIn")
                  : t("attendance.clockOut")}
              </h2>
              <p className="text-xs text-gray-500">
                {t("attendance.gpsRequired")}
              </p>
            </div>
          </div>

          {/* Step 1: Capture GPS */}
          {!gpsPosition ? (
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={requestGPS}
                disabled={gpsLoading}
              >
                {gpsLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 me-2 animate-spin" />
                    Detecting location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-5 w-5 me-2" />
                    📍 Capture Location
                  </>
                )}
              </Button>
              {gpsError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {gpsError}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Location captured */}
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">
                    {t("attendance.locationCaptured")}
                  </p>
                  <p className="text-xs opacity-75">
                    {t("attendance.accuracyMeters", {
                      meters: gpsPosition.accuracy.toFixed(0),
                    })}
                  </p>
                  <p className="text-xs opacity-60 font-mono mt-0.5">
                    {gpsPosition.latitude.toFixed(6)},{" "}
                    {gpsPosition.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              {/* Step 2: Submit */}
              {success ? (
                <div className="p-4 rounded-xl bg-emerald-500/15 text-emerald-600 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-bold">{t("app.success")} ✅</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => submitAttendance("clock_in")}
                    disabled={!canClockIn || submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Clock className="h-5 w-5 me-1" />
                        {t("attendance.clockIn")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    className="w-full"
                    onClick={() => submitAttendance("clock_out")}
                    disabled={!canClockOut || submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Clock className="h-5 w-5 me-1" />
                        {t("attendance.clockOut")}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </GlassCard>

        {/* Today's Records */}
        <GlassCard variant="elevated">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-sky-500" />
            {t("attendance.today")}
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full" />
            </div>
          ) : todayRecords.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                {t("attendance.noRecords")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayRecords.map((record) => (
                <div
                  key={record.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl",
                    "bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/5",
                  )}
                >
                  <StatusBadge
                    status={record.event_type}
                    label={
                      record.event_type === "clock_in"
                        ? t("attendance.clockIn")
                        : t("attendance.clockOut")
                    }
                    size="sm"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {formatDateTime(record.timestamp, i18n.language)}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      📍 {record.latitude.toFixed(4)},{" "}
                      {record.longitude.toFixed(4)}
                      {record.accuracy_meters &&
                        ` (±${record.accuracy_meters.toFixed(0)}m)`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
