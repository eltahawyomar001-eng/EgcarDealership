"use client";

import React, { useEffect, useState, useCallback, useReducer } from "react";
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
  ExternalLink,
  Users,
} from "lucide-react";
import { useRole } from "@/hooks/use-role";

/* ──────────────────── State Machine ──────────────────── */

type GpsState =
  | "IDLE"
  | "REQUESTING_PERMISSION"
  | "FETCHING_COORDINATES"
  | "SYNCING_TO_DB"
  | "SUCCESS"
  | "ERROR";

type GpsAction =
  | { type: "REQUEST" }
  | { type: "COORDINATES_RECEIVED"; payload: GpsPosition }
  | { type: "SUBMIT" }
  | { type: "SUBMITTED" }
  | { type: "FAIL"; payload: string }
  | { type: "RESET" };

interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GpsMachineState {
  state: GpsState;
  position: GpsPosition | null;
  error: string | null;
}

function gpsReducer(
  current: GpsMachineState,
  action: GpsAction,
): GpsMachineState {
  switch (action.type) {
    case "REQUEST":
      return { state: "REQUESTING_PERMISSION", position: null, error: null };
    case "COORDINATES_RECEIVED":
      return {
        state: "FETCHING_COORDINATES",
        position: action.payload,
        error: null,
      };
    case "SUBMIT":
      return { ...current, state: "SYNCING_TO_DB" };
    case "SUBMITTED":
      return { ...current, state: "SUCCESS" };
    case "FAIL":
      return { state: "ERROR", position: null, error: action.payload };
    case "RESET":
      return { state: "IDLE", position: null, error: null };
    default:
      return current;
  }
}

const initialGpsState: GpsMachineState = {
  state: "IDLE",
  position: null,
  error: null,
};

/* ────────────── Google Maps URL helper ────────────── */

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/* ──────────────────── Component ──────────────────── */

export default function AttendancePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const supabase = createClient();
  const { canViewAllAttendance } = useRole();

  const [gps, dispatch] = useReducer(gpsReducer, initialGpsState);
  const [todayRecords, setTodayRecords] = useState<Attendance[]>([]);
  const [allStaffRecords, setAllStaffRecords] = useState<
    (Attendance & { profile_name?: string })[]
  >([]);
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
    if (!user?.id) return;
    let cancelled = false;
    const load = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .gte("timestamp", today.toISOString())
        .order("timestamp", { ascending: false });
      if (cancelled) return;
      const records = (data as Attendance[]) || [];
      setTodayRecords(records);
      if (records.length > 0) setLastAction(records[0].event_type);
      setLoading(false);
    };
    load();

    // Admin/manager: also fetch all staff records
    if (canViewAllAttendance) {
      const loadAll = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data } = await supabase
          .from("attendance")
          .select("*, profile:profiles!attendance_user_id_fkey(full_name)")
          .gte("timestamp", today.toISOString())
          .order("timestamp", { ascending: false });
        if (cancelled) return;
        const records = (data || []).map((r: Record<string, unknown>) => ({
          ...(r as unknown as Attendance),
          profile_name:
            (r.profile as { full_name?: string } | null)?.full_name ||
            "Unknown",
        }));
        setAllStaffRecords(records);
      };
      loadAll();
    }

    return () => {
      cancelled = true;
    };
  }, [user?.id, supabase, canViewAllAttendance]);

  // Request GPS via state machine
  const requestGPS = () => {
    dispatch({ type: "REQUEST" });

    if (!navigator.geolocation) {
      dispatch({ type: "FAIL", payload: t("attendance.locationUnavailable") });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        dispatch({
          type: "COORDINATES_RECEIVED",
          payload: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
        });
      },
      (error) => {
        const message =
          error.code === 1
            ? t("attendance.permissionDenied")
            : error.code === 2
              ? t("attendance.locationUnavailable")
              : t("attendance.locationTimeout");
        dispatch({ type: "FAIL", payload: message });
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
    if (!gps.position || !user) return;
    dispatch({ type: "SUBMIT" });

    try {
      await supabase.from("attendance").insert({
        tenant_id: user.tenant_id,
        user_id: user.id,
        event_type: eventType,
        latitude: gps.position.latitude,
        longitude: gps.position.longitude,
        accuracy_meters: gps.position.accuracy,
        device_info: navigator.userAgent.substring(0, 200),
      });

      dispatch({ type: "SUBMITTED" });
      setLastAction(eventType);
      setTimeout(() => {
        dispatch({ type: "RESET" });
        fetchTodayRecords();
      }, 2000);
    } catch {
      dispatch({ type: "FAIL", payload: t("app.error") });
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

          {/* State: IDLE or ERROR -- show capture button */}
          {(gps.state === "IDLE" || gps.state === "ERROR") && (
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full touch-target"
                onClick={requestGPS}
              >
                <MapPin className="h-5 w-5 me-2" />
                {t("attendance.captureLocation")}
              </Button>
              {gps.error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {gps.error}
                </div>
              )}
            </div>
          )}

          {/* State: REQUESTING_PERMISSION */}
          {gps.state === "REQUESTING_PERMISSION" && (
            <div className="flex items-center justify-center gap-3 py-6">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
              <span className="text-sm text-gray-500">
                {t("attendance.detectingLocation")}
              </span>
            </div>
          )}

          {/* State: FETCHING_COORDINATES -- location captured, ready to submit */}
          {gps.state === "FETCHING_COORDINATES" && gps.position && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {t("attendance.locationCaptured")}
                    </p>
                    <p className="text-xs opacity-75">
                      {t("attendance.accuracyMeters", {
                        meters: gps.position.accuracy.toFixed(0),
                      })}
                    </p>
                  </div>
                  <a
                    href={googleMapsUrl(
                      gps.position.latitude,
                      gps.position.longitude,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t("attendance.viewOnMap")}
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full touch-target"
                  onClick={() => submitAttendance("clock_in")}
                  disabled={!canClockIn}
                >
                  <Clock className="h-5 w-5 me-1" />
                  {t("attendance.clockIn")}
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  className="w-full touch-target"
                  onClick={() => submitAttendance("clock_out")}
                  disabled={!canClockOut}
                >
                  <Clock className="h-5 w-5 me-1" />
                  {t("attendance.clockOut")}
                </Button>
              </div>
            </div>
          )}

          {/* State: SYNCING_TO_DB */}
          {gps.state === "SYNCING_TO_DB" && (
            <div className="flex items-center justify-center gap-3 py-6">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
              <span className="text-sm text-gray-500">{t("app.loading")}</span>
            </div>
          )}

          {/* State: SUCCESS */}
          {gps.state === "SUCCESS" && (
            <div className="p-4 rounded-xl bg-emerald-500/15 text-emerald-600 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
              <p className="font-bold">
                {t("attendance.recordedSuccessfully")}
              </p>
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {formatDateTime(record.timestamp, i18n.language)}
                    </p>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      {record.latitude.toFixed(4)},{" "}
                      {record.longitude.toFixed(4)}
                      {record.accuracy_meters &&
                        ` (±${record.accuracy_meters.toFixed(0)}m)`}
                    </p>
                  </div>
                  <a
                    href={googleMapsUrl(record.latitude, record.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/5 transition-colors shrink-0"
                    title={t("attendance.viewOnMap")}
                  >
                    <ExternalLink className="h-4 w-4 text-sky-500" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Admin/Manager: All Staff Records */}
      {canViewAllAttendance && (
        <GlassCard variant="elevated">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-500" />
            {t("attendance.allStaffToday")}
          </h2>
          {allStaffRecords.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                {t("attendance.noRecords")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allStaffRecords.map((record) => (
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{record.profile_name}</p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(record.timestamp, i18n.language)}
                    </p>
                  </div>
                  <a
                    href={googleMapsUrl(record.latitude, record.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/5 transition-colors shrink-0"
                    title={t("attendance.viewOnMap")}
                  >
                    <ExternalLink className="h-4 w-4 text-sky-500" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
