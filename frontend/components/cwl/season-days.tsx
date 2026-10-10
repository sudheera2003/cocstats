import Link from "next/link"
import { StarIcon } from "lucide-react"

import { OutcomeBadge } from "@/components/badges"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CwlDay } from "@/lib/cwl"
import { formatPercent } from "@/lib/format"
import type { WarOutcome } from "@/lib/stats"
import { cn } from "@/lib/utils"

const OUTCOME_RING: Record<WarOutcome, string> = {
  win: "ring-emerald-500/30",
  loss: "ring-rose-500/30",
  tie: "ring-sky-500/30",
  ongoing: "ring-amber-500/40",
  unrecorded: "",
}

/** One card per CWL day: the war's result, or a placeholder until it's drawn. */
export function SeasonDays({ days }: { days: CwlDay[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {days.map(({ day, war, score, outcome }) => {
        const hasOpponent =
          war !== null &&
          war.opponentStars !== null &&
          war.opponentDestruction !== null
        const preparing = war?.phase === "preparation"
        return (
          <li key={day}>
            <Card
              size="sm"
              className={cn(
                "relative h-full",
                war
                  ? cn(
                      "transition-colors hover:bg-muted/40",
                      outcome && !preparing && OUTCOME_RING[outcome]
                    )
                  : "border border-dashed border-foreground/25 bg-transparent ring-0"
              )}
            >
              <CardHeader>
                <CardTitle className="text-muted-foreground">
                  Day {day}
                </CardTitle>
                {outcome && (
                  <CardAction>
                    <OutcomeBadge outcome={outcome} preparing={preparing} />
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="space-y-1">
                {war && score ? (
                  <>
                    {/* Stretched over the whole card. */}
                    <Link
                      href={`/wars/${war.id}`}
                      className="block truncate font-medium outline-none after:absolute after:inset-0 after:rounded-lg hover:underline focus-visible:after:ring-2 focus-visible:after:ring-ring/50"
                    >
                      vs {war.opponent}
                    </Link>
                    {preparing ? (
                      <p className="text-xs text-muted-foreground">
                        {war.roster.length} in the lineup
                      </p>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <span className="font-heading text-xl font-semibold">
                            {score.stars}
                          </span>
                          <StarIcon
                            aria-label="stars"
                            className="size-3.5 fill-amber-400 text-amber-400"
                          />
                          {hasOpponent && (
                            <span className="text-muted-foreground">
                              – {war.opponentStars}
                            </span>
                          )}
                        </div>
                        <div className="text-[0.7rem] text-muted-foreground tabular-nums">
                          {formatPercent(score.destruction, 2)}
                          {hasOpponent &&
                            ` – ${formatPercent(war.opponentDestruction, 2)}`}{" "}
                          · {score.attacksUsed}/{score.attacksAvailable} attacks
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Not drawn yet</p>
                )}
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
