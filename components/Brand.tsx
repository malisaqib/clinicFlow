import Link from "next/link";

/**
 * ClinicFlow mark: a calendar "slot" cradling a leaf — booking + care, the two
 * halves of the product. CSS/SVG only, inherits currentColor.
 */
export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="3.5" y="6.5" width="25" height="21" rx="6" stroke="currentColor" strokeWidth="2" />
      <path d="M10 4.5v5M22 4.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 22c0-3.6 2.2-6.2 6-6.6-0.2 3.8-2.4 6.4-6 6.6Zm0 0c0-2.8-1.7-4.8-4.6-5.1 0.2 3 1.9 5 4.6 5.1Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

export function Wordmark({ href = "/", tone = "brand" }: { href?: string; tone?: "brand" | "ink" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 ${tone === "brand" ? "text-brand" : "text-ink"} focus-visible:outline-none`}
    >
      <BrandMark className="h-7 w-7" />
      <span className="font-display text-xl tracking-tight">
        Clinic<span className="text-accent-strong">Flow</span>
      </span>
    </Link>
  );
}
