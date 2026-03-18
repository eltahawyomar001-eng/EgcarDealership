import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format currency in Egyptian Pound */
export function formatEGP(amount: number): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format currency in Arabic Egyptian Pound */
export function formatEGPArabic(amount: number): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format date for Egypt locale */
export function formatDate(date: string | Date, locale: string = "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Format date with time */
export function formatDateTime(
  date: string | Date,
  locale: string = "en",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Calculate profit */
export function calculateProfit(
  purchasePrice: number,
  salePrice: number,
): number {
  return salePrice - purchasePrice;
}

/** Calculate profit percentage */
export function calculateProfitPercentage(
  purchasePrice: number,
  salePrice: number,
): number {
  if (purchasePrice === 0) return 0;
  return ((salePrice - purchasePrice) / purchasePrice) * 100;
}

/** Determine if a date is overdue */
export function isOverdue(dueDate: string | Date): boolean {
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return d < new Date();
}

/** Get status color class */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
    reserved: "bg-amber-500/15 text-amber-700 border-amber-500/25",
    sold: "bg-blue-500/15 text-blue-700 border-blue-500/25",
    paid: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
    upcoming: "bg-blue-500/15 text-blue-700 border-blue-500/25",
    overdue: "bg-red-500/15 text-red-700 border-red-500/25",
    partially_paid: "bg-amber-500/15 text-amber-700 border-amber-500/25",
    pending: "bg-amber-500/15 text-amber-700 border-amber-500/25",
    completed: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
    cancelled: "bg-gray-500/15 text-gray-700 border-gray-500/25",
    clock_in: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
    clock_out: "bg-gray-500/15 text-gray-700 border-gray-500/25",
  };
  return colors[status] || "bg-gray-500/15 text-gray-700 border-gray-500/25";
}

/** Detect if device is mobile */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}
