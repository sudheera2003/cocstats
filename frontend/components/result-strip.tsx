import { OUTCOME_META } from "@/components/badges"
import type { WarOutcome } from "@/lib/stats"
import { cn } from "@/lib/utils"

/** A row of pips, one per war, oldest on the left. */
export function ResultStrip({
  outcomes,
  slots,
  size = "sm",
  className,
}: {
  outcomes: (WarOutcome | null)[]
  /** Pads with empty pips up to this many, for a fixed-length run like a CWL week. */
  slots?: number
  size?: "sm" | "lg"
  className?: string
}) {
  const pips: (WarOutcome | null)[] = [
    ...outcomes,
    ...Array.from<null>({
      length: Math.max(0, (slots ?? 0) - outcomes.length),
    }).fill(null),
  ]
  const played = outcomes.filter((outcome) => outcome !== null)

  return (
    <span
      role="img"
      aria-label={
        played.length > 0
          ? `Results, oldest first: ${played
              .map((outcome) => OUTCOME_META[outcome].label)
              .join(", ")}`
          : "No results yet"
      }
      className={cn(
        "inline-flex shrink-0 items-center",
        size === "lg" ? "w-full gap-1" : "gap-0.5",
        className
      )}
    >
      {pips.map((outcome, index) => (
        <span
          key={index}
          title={outcome ? OUTCOME_META[outcome].label : "Not played"}
          className={cn(
            size === "lg" ? "h-1.5 flex-1 rounded-full" : "size-2 rounded-[3px]",
            outcome ? OUTCOME_META[outcome].dot : "bg-muted",
            outcome === "ongoing" && "animate-pulse"
          )}
        />
      ))}
    </span>
  )
}
