import Link from "next/link";

import { Wordmark } from "@/components/Brand";

/**
 * Friendly full-page fallback shown when Supabase server env vars are missing, so the
 * app never hard-crashes during first-time setup — it explains exactly what to fill in.
 */
export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6">
      <div className="daylight paper pointer-events-none absolute inset-0 -z-10" />
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface-3 p-8 shadow-[var(--shadow-calm)]">
        <Wordmark />
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-accent-strong">
          Almost there
        </p>
        <h1 className="mt-2 font-display text-2xl">Connect Supabase to load live data</h1>
        <p className="mt-3 text-sm text-ink-soft">
          The frontend is wired up, but these server environment variables in{" "}
          <code className="rounded bg-brand-tint px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
          are still empty:
        </p>
        <ul className="mt-4 space-y-1.5">
          {missing.map((name) => (
            <li key={name} className="font-mono text-sm text-brand-strong">
              · {name}
            </li>
          ))}
        </ul>
        <ol className="mt-5 space-y-1.5 text-sm text-ink-soft">
          <li>1. Fill the values from your Supabase project.</li>
          <li>2. Apply <code className="font-mono text-xs">supabase/migrations</code> and <code className="font-mono text-xs">supabase/seed.sql</code>.</li>
          <li>3. Restart the dev server.</li>
        </ol>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full border border-brand/30 px-4 py-2 text-sm font-medium text-brand hover:bg-brand-tint"
        >
          ← Back home
        </Link>
      </div>
    </main>
  );
}
