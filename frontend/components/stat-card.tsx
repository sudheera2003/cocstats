import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { EMPTY } from "@/lib/format"
import { cn } from "@/lib/utils"

export type StatTone = "neutral" | "gold" | "sky" | "emerald" | "violet" | "rose"

const TONES: Record<StatTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  gold: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  sky: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  rose: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: LucideIcon
  /** Colour of the icon chip. The same metric keeps the same colour on every page. */
  tone?: StatTone
  className?: string
}) {
  return (
    <Card size="sm" className={className}>
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </span>
          {Icon && (
            <span
              aria-hidden
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md",
                TONES[tone]
              )}
            >
              <Icon className="size-3.5" />
            </span>
          )}
        </div>
        <div
          className={cn(
            "font-heading text-2xl font-semibold tracking-tight tabular-nums",
            // A lone dash at this size reads as a thick rule, so fade it.
            value === EMPTY && "text-muted-foreground/50"
          )}
        >
          {value}
        </div>
        {hint && (
          <div
            className="truncate text-xs text-muted-foreground"
            title={typeof hint === "string" ? hint : undefined}
          >
            {hint}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
