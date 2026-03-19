import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// ============================================================================
// Mock: next/navigation
// ============================================================================
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// ============================================================================
// Mock: react-i18next
// ============================================================================
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      changeLanguage: vi.fn(),
      dir: () => "ltr",
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

// ============================================================================
// Mock: Auth Provider (configurable via __mockRole__)
// ============================================================================
let __mockRole__ = "admin";
let __mockUser__: Record<string, unknown> | null = {
  id: "test-user-id",
  tenant_id: "test-tenant-id",
  role: "admin",
  full_name: "Test User",
  email: "test@caros.eg",
};

export function setMockRole(role: string) {
  __mockRole__ = role;
  if (__mockUser__) {
    __mockUser__.role = role;
  }
}

export function setMockUser(user: Record<string, unknown> | null) {
  __mockUser__ = user;
  if (user?.role) {
    __mockRole__ = user.role as string;
  }
}

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    user: __mockUser__ ? { ...__mockUser__, role: __mockRole__ } : null,
    loading: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ============================================================================
// Mock: matchMedia (for isMobileDevice, responsive components)
// ============================================================================
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ============================================================================
// Mock: IntersectionObserver
// ============================================================================
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

// ============================================================================
// Mock: navigator.geolocation
// ============================================================================
Object.defineProperty(navigator, "geolocation", {
  value: {
    getCurrentPosition: vi.fn().mockImplementation((success) =>
      success({
        coords: {
          latitude: 30.0444,
          longitude: 31.2357,
          accuracy: 10,
        },
      }),
    ),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
});
