"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/Brand";
import { DEMO_CLINICS, useAuth } from "@/lib/auth/mock-auth";

const NAV = [
  { href: "/dashboard", label: "Lead desk" },
  { href: "/admin", label: "Clinic setup" },
];

export function InternalChrome({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, signIn, signOut, switchClinic } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated || !user) {
    return <SignedOut onSignIn={signIn} />;
  }

  return (
    <div className="min-h-dvh">
      {/* Dev-only banner making it unmistakable that auth is mocked. */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 bg-accent px-4 py-1.5 text-center text-[13px] text-brand-strong">
        <span className="font-semibold">Demo mode</span>
        <span className="opacity-80">
          Auth is mocked — signed in as {user.name} at {user.clinicName}. Not production-ready.
        </span>
      </div>

      <header className="sticky top-0 z-30 border-b border-line bg-surface-2/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 text-brand">
              <BrandMark className="h-6 w-6" />
              <span className="font-display text-lg tracking-tight text-ink">
                Clinic<span className="text-accent-strong">Flow</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-brand text-surface-3"
                        : "text-ink-soft hover:bg-brand-tint hover:text-brand"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="clinic-switcher">
              Active clinic
            </label>
            <select
              id="clinic-switcher"
              value={user.clinicSlug}
              onChange={(e) => switchClinic(e.target.value)}
              className="rounded-lg border border-line bg-surface-3 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            >
              {DEMO_CLINICS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}

function SignedOut({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface-3 p-8 text-center shadow-[var(--shadow-calm)]">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand text-surface-3">
          <BrandMark className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl">Staff sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">
          This internal area is gated behind the (mocked) staff session. Real Supabase Auth is planned.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-6 w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-surface-3 hover:bg-brand-strong"
        >
          Continue as clinic staff
        </button>
      </div>
    </div>
  );
}
