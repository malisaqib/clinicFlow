import type { WorkingHour } from "@/lib/types";
import { dayShort, formatTime } from "@/lib/format";

// The signature motif: a Sun–Sat week strip where each open day renders a marigold
// band positioned by *when* in the day the clinic is open (7am–10pm scale), so the
// shape itself reads "opens late morning, closes evening". Recurs on public pages and
// (compact) in the dashboard.

const SCALE_START = 7 * 60; // 07:00
const SCALE_END = 22 * 60; // 22:00
const SCALE_SPAN = SCALE_END - SCALE_START;

function toMinutes(time: string | null): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function bandPosition(open: string | null, close: string | null) {
  const start = toMinutes(open);
  const end = toMinutes(close);
  if (start == null || end == null || end <= start) return null;
  const left = ((Math.max(start, SCALE_START) - SCALE_START) / SCALE_SPAN) * 100;
  const width = ((Math.min(end, SCALE_END) - Math.max(start, SCALE_START)) / SCALE_SPAN) * 100;
  return { left: `${left}%`, width: `${Math.max(width, 4)}%` };
}

export function AvailabilityRibbon({
  workingHours,
  variant = "public",
  className = "",
}: {
  workingHours: WorkingHour[];
  variant?: "public" | "compact";
  className?: string;
}) {
  const byDay = new Map(workingHours.map((h) => [h.day_of_week, h]));
  const today = new Date().getDay();
  const compact = variant === "compact";

  return (
    <div className={className}>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: 7 }, (_, dow) => {
          const hour = byDay.get(dow);
          const closed = !hour || hour.is_closed || !hour.open_time || !hour.close_time;
          const band = closed ? null : bandPosition(hour!.open_time, hour!.close_time);
          const isToday = dow === today;

          return (
            <div
              key={dow}
              className={[
                "rounded-xl border px-1.5 pt-1.5 text-center transition-colors",
                compact ? "pb-1.5" : "pb-2",
                isToday
                  ? "border-brand/40 bg-brand-tint/60 ring-1 ring-brand/25"
                  : "border-line bg-surface-3/70",
              ].join(" ")}
            >
              <div
                className={[
                  "font-mono uppercase tracking-wider",
                  compact ? "text-[10px]" : "text-[11px]",
                  isToday ? "text-brand" : "text-muted",
                ].join(" ")}
              >
                {dayShort(dow)}
              </div>

              {/* The day-length track with the open band placed inside it. */}
              <div
                className={[
                  "relative mt-1.5 w-full overflow-hidden rounded-full",
                  compact ? "h-1.5" : "h-2",
                  closed ? "bg-[repeating-linear-gradient(135deg,transparent,transparent_3px,var(--color-line)_3px,var(--color-line)_5px)]" : "bg-line/60",
                ].join(" ")}
                aria-hidden="true"
              >
                {band && (
                  <span
                    className="absolute inset-y-0 rounded-full bg-accent"
                    style={{ left: band.left, width: band.width }}
                  />
                )}
              </div>

              {!compact && (
                <div className="mt-1.5 min-h-[1.75rem] text-[11px] leading-tight">
                  {closed ? (
                    <span className="text-muted/70">Closed</span>
                  ) : (
                    <span className="font-mono text-ink-soft">
                      {formatTime(hour!.open_time)}
                      <br />
                      {formatTime(hour!.close_time)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
