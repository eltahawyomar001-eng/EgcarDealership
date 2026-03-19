/**
 * Haptic Feedback Utility
 * Uses the Web Vibration API to provide physical feedback on mobile devices.
 * Fails silently on devices that don't support vibration (desktop, iOS Safari).
 */

type HapticType =
  | "success"
  | "error"
  | "warning"
  | "light"
  | "medium"
  | "heavy"
  | "selection";

/** Vibration patterns in milliseconds [vibrate, pause, vibrate, ...] */
const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  /** Short, satisfying pulse — car sold, payment recorded */
  success: [10, 50, 10],
  /** Double pulse with pause — validation error, failed action */
  error: [30, 100, 30, 100, 30],
  /** Single medium pulse — warning, overdue alert */
  warning: [20, 80, 20],
  /** Tiny tap — button press, selection change */
  light: 5,
  /** Medium tap — toggle switch, card tap */
  medium: 15,
  /** Strong tap — important action confirmation */
  heavy: 25,
  /** Minimal tick — list item selection */
  selection: 3,
};

/**
 * Trigger haptic feedback on the device.
 * @param type - The type of haptic pattern to play
 * @returns true if vibration was triggered, false if unsupported
 */
export function triggerHaptic(type: HapticType = "light"): boolean {
  if (typeof navigator === "undefined" || !navigator.vibrate) {
    return false;
  }

  try {
    const pattern = HAPTIC_PATTERNS[type];
    navigator.vibrate(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Cancel any ongoing vibration.
 */
export function cancelHaptic(): void {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(0);
  }
}
