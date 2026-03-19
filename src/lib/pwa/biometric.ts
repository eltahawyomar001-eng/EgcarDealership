/**
 * Biometric Authentication Utility
 * Uses the Web Authentication API (WebAuthn) for FaceID/Fingerprint unlock.
 */

const CREDENTIAL_STORAGE_KEY = "caros-biometric-credential-id";

/**
 * Check if WebAuthn / biometric authentication is available.
 */
export function isBiometricAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential
      .isUserVerifyingPlatformAuthenticatorAvailable === "function"
  );
}

/**
 * Check if the device has a platform authenticator (FaceID, Fingerprint, Windows Hello).
 */
export async function hasPlatformAuthenticator(): Promise<boolean> {
  if (!isBiometricAvailable()) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Check if the user has already enrolled biometric credentials.
 */
export function isEnrolled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return !!localStorage.getItem(CREDENTIAL_STORAGE_KEY);
}

/**
 * Enroll a biometric credential for the user.
 * This creates a new credential using the platform authenticator.
 */
export async function enrollBiometric(
  userId: string,
  userName: string,
): Promise<boolean> {
  if (!(await hasPlatformAuthenticator())) return false;

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "CarOS Egypt",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential;

    if (credential) {
      // Store the credential ID for future verification
      const credId = btoa(
        String.fromCharCode(...new Uint8Array(credential.rawId)),
      );
      localStorage.setItem(CREDENTIAL_STORAGE_KEY, credId);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Verify the user's biometric (FaceID / Fingerprint).
 * Returns true if the user successfully authenticated.
 */
export async function verifyBiometric(): Promise<boolean> {
  const storedCredId = localStorage.getItem(CREDENTIAL_STORAGE_KEY);
  if (!storedCredId || !(await hasPlatformAuthenticator())) return false;

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credIdBuffer = Uint8Array.from(atob(storedCredId), (c) =>
      c.charCodeAt(0),
    );

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: credIdBuffer,
            type: "public-key",
            transports: ["internal"],
          },
        ],
        userVerification: "required",
        timeout: 60000,
      },
    });

    return !!assertion;
  } catch {
    return false;
  }
}

/**
 * Remove enrolled biometric credential.
 */
export function removeBiometric(): void {
  localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
}
