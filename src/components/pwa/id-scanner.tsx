"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2, ScanLine, AlertCircle } from "lucide-react";
import { triggerHaptic } from "@/lib/pwa/haptics";

interface ScanResult {
  fullName?: string;
  nationalId?: string;
  address?: string;
  rawText: string;
}

interface IDScannerProps {
  onScanComplete: (result: ScanResult) => void;
  onClose: () => void;
}

/**
 * IDScanner — Camera-based OCR for Egyptian National ID.
 * Uses the camera to capture an image and processes it with Tesseract.js.
 *
 * Flow:
 * 1. Opens camera
 * 2. User captures photo of Egyptian National ID
 * 3. OCR extracts Name, ID Number, and Address
 * 4. Auto-fills the form fields
 */
export function IDScanner({ onScanComplete, onClose }: IDScannerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
      setIsScanning(true);
    } catch {
      setError(t("pwa.cameraPermissionDenied"));
    }
  }, [t]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setCameraReady(false);
  }, []);

  // Capture & process
  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    triggerHaptic("medium");
    setIsProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Get image data
    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    try {
      // Dynamically import Tesseract to reduce initial bundle size
      const Tesseract = await import("tesseract.js");

      const result = await Tesseract.recognize(imageData, "ara+eng", {
        logger: () => {},
      });

      const text = result.data.text;
      const parsed = parseEgyptianID(text);

      stopCamera();
      triggerHaptic("success");
      onScanComplete({
        ...parsed,
        rawText: text,
      });
    } catch {
      setError(t("pwa.scanFailed"));
      triggerHaptic("error");
    } finally {
      setIsProcessing(false);
    }
  }, [stopCamera, onScanComplete, t]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Start camera on mount
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <GlassCard variant="elevated" className="w-full max-w-lg relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-sky-500" />
            {t("pwa.scanID")}
          </h3>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] mb-4">
          {isScanning && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scanning overlay with guides */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner guides */}
                <div className="absolute top-4 start-4 w-12 h-12 border-t-2 border-s-2 border-sky-400 rounded-tl-lg" />
                <div className="absolute top-4 end-4 w-12 h-12 border-t-2 border-e-2 border-sky-400 rounded-tr-lg" />
                <div className="absolute bottom-4 start-4 w-12 h-12 border-b-2 border-s-2 border-sky-400 rounded-bl-lg" />
                <div className="absolute bottom-4 end-4 w-12 h-12 border-b-2 border-e-2 border-sky-400 rounded-br-lg" />
                {/* Scanning line animation */}
                {cameraReady && !isProcessing && (
                  <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-scan-line" />
                )}
              </div>
            </>
          )}

          {!isScanning && !error && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
              <p className="text-white text-sm font-medium">
                {t("pwa.processing")}
              </p>
            </div>
          )}
        </div>

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Instructions */}
        <p className="text-xs text-gray-500 text-center mb-4">
          {t("pwa.scanIDHint")}
        </p>

        {/* Capture button */}
        <div className="flex gap-3">
          {isScanning && !isProcessing && (
            <Button
              variant="primary"
              size="lg"
              className="flex-1 touch-target"
              onClick={captureAndProcess}
            >
              <Camera className="h-5 w-5 me-2" />
              {t("pwa.capture")}
            </Button>
          )}
          {error && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 touch-target"
              onClick={startCamera}
            >
              {t("pwa.retryCamera")}
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

/**
 * Parse Egyptian National ID text from OCR output.
 * Egyptian National IDs contain:
 * - 14-digit national number
 * - Name in Arabic
 * - Address in Arabic
 */
function parseEgyptianID(text: string): Omit<ScanResult, "rawText"> {
  const result: Omit<ScanResult, "rawText"> = {};

  // Extract 14-digit national ID number
  const idMatch = text.match(/\d{14}/);
  if (idMatch) {
    result.nationalId = idMatch[0];
  }

  // Try to extract name (usually after specific Arabic keywords)
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Look for Arabic name pattern (lines with Arabic characters, no digits)
  const arabicNamePattern = /^[\u0600-\u06FF\s]{4,}$/;
  const nameLines = lines.filter((line) => arabicNamePattern.test(line));
  if (nameLines.length > 0) {
    result.fullName = nameLines[0];
  }

  // Look for address (usually contains Arabic locality words)
  const addressKeywords = /شارع|ش\.|محافظة|مركز|قرية|مدينة|حي|عمارة/;
  const addressLine = lines.find((line) => addressKeywords.test(line));
  if (addressLine) {
    result.address = addressLine;
  }

  return result;
}
