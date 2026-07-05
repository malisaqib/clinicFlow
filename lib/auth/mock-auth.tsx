"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK AUTH — temporary stand-in until Supabase Auth ships (README: "planned").
//
// Everything auth-related is isolated behind this one file. Pages call `useAuth()`
// and never touch Supabase Auth directly, so swapping in the real implementation
// means rewriting only this provider — not every dashboard/admin route.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type StaffUser = {
  name: string;
  role: "staff";
  clinicSlug: string;
  clinicName: string;
};

/** Seeded demo clinics — used for the mock clinic switcher. */
export const DEMO_CLINICS = [
  { slug: "glowskin-demo", name: "GlowSkin Aesthetic Clinic" },
  { slug: "smilecare-demo", name: "SmileCare Dental Clinic" },
] as const;

const DEFAULT_SLUG = "glowskin-demo";
const STORAGE_KEY = "clinicflow.mock-clinic";

function makeUser(slug: string): StaffUser {
  const clinic = DEMO_CLINICS.find((c) => c.slug === slug) ?? DEMO_CLINICS[0];
  return {
    name: "Ayesha — Front Desk",
    role: "staff",
    clinicSlug: clinic.slug,
    clinicName: clinic.name,
  };
}

type AuthContextValue = {
  /** Always true in mock mode; makes the "is this real?" swap obvious later. */
  readonly isMock: true;
  user: StaffUser | null;
  isAuthenticated: boolean;
  /** Switch which seeded clinic the staff session is scoped to (demo convenience). */
  switchClinic: (slug: string) => void;
  signOut: () => void;
  signIn: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<string>(DEFAULT_SLUG);
  const [signedOut, setSignedOut] = useState(false);

  // Hydrate the chosen clinic from localStorage after mount (SSR-safe).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && DEMO_CLINICS.some((c) => c.slug === stored)) {
        // Hydrate the persisted choice after mount so SSR and first client render match.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSlug(stored);
      }
    } catch {
      /* localStorage unavailable — fall back to default */
    }
  }, []);

  const switchClinic = useCallback((next: string) => {
    setSlug(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore persistence failures */
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isMock: true,
      user: signedOut ? null : makeUser(slug),
      isAuthenticated: !signedOut,
      switchClinic,
      signOut: () => setSignedOut(true),
      signIn: () => setSignedOut(false),
    }),
    [slug, signedOut, switchClinic],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within a MockAuthProvider.");
  }
  return ctx;
}
