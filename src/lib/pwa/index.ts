/**
 * PWA Utilities — Barrel export
 */

export { triggerHaptic, cancelHaptic } from "./haptics";
export {
  shareContent,
  buildCarShareText,
  buildPaymentReceiptText,
  canShare,
} from "./share";
export {
  saveDraft,
  getUnsyncedDrafts,
  markDraftSynced,
  deleteDraft,
  getUnsyncedCount,
  saveSetting,
  getSetting,
  clearSyncedDrafts,
  type DraftTransaction,
  type DraftType,
} from "./offline-storage";
export {
  isBiometricAvailable,
  hasPlatformAuthenticator,
  isEnrolled,
  enrollBiometric,
  verifyBiometric,
  removeBiometric,
} from "./biometric";
