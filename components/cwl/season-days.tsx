import Link from "next/link"

import { OutcomeBadge } from "@/components/badges"
import { StartDayButton } from "@/components/cwl/start-day-dialog"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { previousLineup, type CwlDay } from "@/lib/cwl"
import { formatPercent } from "@/lib/format"
import type { PlayerDTO, SeasonDTO, WarDTO } from "@/lib/types"

/** One card per CWL day: the war's result, or a button to start it. */
export function SeasonDays({
  season,
  days,
  wars,
  rosterPlayers,
}: {
  season: SeasonDTO
  days: CwlDay[]
  wars: WarDTO[]
  rosterPlayers: PlayerDTO[]
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {days.map(({ day, war, score, outcome }) => {
        const hasOpponent =
          war !== null &&
          war.opponentStars !== null &&
          war.opponentDestruction !== null
        return (
          <li key={day}>
            <Card size="sm" className="h-full">
              <CardHeader>
                <CardTitle>Day {day}</CardTitle>
                {outcome && (
                  <CardAction>
                    <OutcomeBadge outcome={outcome} />
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="space-y-1">
                {war && score ? (
                  <Link
                    href={`/wars/${war.id}`}
                    className="group block space-y-1"
                  >
                    <div className="truncate font-medium group-hover:underline">
                      vs {war.opponent}
                    </div>
                    <div className="flex items-baseline gap-1.5 tabular-nums">
                      <span className="text-xl font-semibold">
                        {score.stars}★
                      </span>
                      {hasOpponent && (
                        <span className="text-muted-foreground">
                          vs {war.opponentStars}★
                        </span>
                      )}
                    </div>
                    <div className="text-[0.7rem] text-muted-foreground tabular-nums">
                      {formatPercent(score.destruction, 2)}
                      {hasOpponent &&
                        ` vs ${formatPercent(war.opponentDestruction, 2)}`}{" "}
                      · {score.attacksUsed}/{score.attacksAvailable} attacks
                    </div>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Not started</p>
                    <StartDayButton
                      season={season}
                      players={rosterPlayers}
                      day={day}
                      defaultLineup={previousLineup(wars, day)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
