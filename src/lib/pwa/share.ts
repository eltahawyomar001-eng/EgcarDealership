/**
 * Native Share Utility
 * Uses the Web Share API to open the native share sheet on mobile.
 * Falls back to clipboard copy on unsupported browsers.
 */

export interface ShareData {
  title: string;
  text: string;
  url?: string;
}

/**
 * Check if the Web Share API is available.
 */
export function canShare(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

/**
 * Share content using the native share sheet.
 * Falls back to copying to clipboard if Web Share is unavailable.
 *
 * @returns "shared" | "copied" | "failed"
 */
export async function shareContent(
  data: ShareData,
): Promise<"shared" | "copied" | "failed"> {
  if (canShare()) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return "shared";
    } catch (err) {
      // User cancelled the share — not an error
      if (err instanceof Error && err.name === "AbortError") {
        return "failed";
      }
    }
  }

  // Fallback: copy to clipboard
  try {
    const copyText = `${data.title}\n${data.text}${data.url ? `\n${data.url}` : ""}`;
    await navigator.clipboard.writeText(copyText);
    return "copied";
  } catch {
    return "failed";
  }
}

/**
 * Share car details — formatted for WhatsApp-friendly text
 */
export function buildCarShareText(car: {
  make: string;
  model: string;
  year: number;
  price: number;
  color?: string;
  mileage?: number;
}): ShareData {
  const priceFormatted = new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(car.price);

  const lines = [
    `🚗 ${car.year} ${car.make} ${car.model}`,
    `💰 Price: ${priceFormatted}`,
  ];
  if (car.color) lines.push(`🎨 Color: ${car.color}`);
  if (car.mileage) lines.push(`📏 Mileage: ${car.mileage.toLocaleString()} km`);
  lines.push("\n📱 CarOS Egypt — Smart Dealership");

  return {
    title: `${car.year} ${car.make} ${car.model}`,
    text: lines.join("\n"),
  };
}

/**
 * Share payment receipt — formatted for WhatsApp
 */
export function buildPaymentReceiptText(receipt: {
  buyerName: string;
  carName: string;
  amountPaid: number;
  installmentNumber: number;
  totalInstallments: number;
  date: string;
}): ShareData {
  const amount = new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(receipt.amountPaid);

  return {
    title: `Payment Receipt — ${receipt.buyerName}`,
    text: [
      `✅ Payment Confirmation`,
      `👤 Buyer: ${receipt.buyerName}`,
      `🚗 Car: ${receipt.carName}`,
      `💰 Amount: ${amount}`,
      `📋 Installment: ${receipt.installmentNumber} / ${receipt.totalInstallments}`,
      `📅 Date: ${receipt.date}`,
      `\n📱 CarOS Egypt`,
    ].join("\n"),
  };
}
