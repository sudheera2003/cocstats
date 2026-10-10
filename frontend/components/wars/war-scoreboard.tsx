import { StarIcon } from "lucide-react"

import { OutcomeBadge } from "@/components/badges"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatNumber, formatPercent } from "@/lib/format"
import {
  flattenAttacks,
  summarize,
  type WarOutcome,
  type WarScore,
} from "@/lib/stats"
import type { WarDTO } from "@/lib/types"
import { cn } from "@/lib/utils"

function Side({
  label,
  stars,
  destruction,
  maxStars,
  placeholder,
  opponent = false,
}: {
  label: string
  stars: number | null
  destruction: number | null
  maxStars: number
  /** Shown instead of the destruction when this side has no score yet. */
  placeholder?: string
  opponent?: boolean
}) {
  return (
    <div className={cn("min-w-0 space-y-2", opponent && "text-right")}>
      <div className="truncate text-xs font-medium text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "flex items-center gap-1.5",
          opponent && "flex-row-reverse"
        )}
      >
        <span
          className={cn(
            "font-heading text-4xl font-semibold tracking-tight tabular-nums",
            stars === null && "text-muted-foreground/40"
          )}
        >
          {stars ?? "?"}
        </span>
        <StarIcon
          aria-label="stars"
          className={cn(
            "size-5",
            stars === null
              ? "text-muted-foreground/40"
              : "fill-amber-400 text-amber-400"
          )}
        />
      </div>
      {/* Both bars grow towards the middle, like a tug of war. */}
      <Progress
        value={stars === null ? 0 : (stars / maxStars) * 100}
        aria-label={`${stars ?? 0} of ${maxStars} stars`}
        className={cn(
          "h-1.5",
          opponent &&
            "-scale-x-100 *:data-[slot=progress-indicator]:bg-muted-foreground/60"
        )}
      />
      <div className="text-xs text-muted-foreground tabular-nums">
        {destruction === null ? (
          placeholder
        ) : (
          <>
            <span className="font-medium text-foreground">
              {formatPercent(destruction, 2)}
            </span>{" "}
            destruction
          </>
        )}
      </div>
    </div>
  )
}

function Fact({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[0.7rem] text-muted-foreground">{label}</dt>
      <dd className="font-heading text-lg font-semibold tabular-nums">
        {children}
      </dd>
    </div>
  )
}

function OutOf({ value, total }: { value: number; total: number }) {
  return (
    <>
      {value}
      <span className="text-xs font-normal text-muted-foreground">
        {" "}
        / {total}
      </span>
    </>
  )
}

/** The war at a glance: our score against theirs, then how the attacks went. */
export function WarScoreboard({
  war,
  score,
  outcome,
  clanName,
}: {
  war: WarDTO
  score: WarScore
  outcome: WarOutcome
  clanName: string
}) {
  const summary = summarize(flattenAttacks([war]))
  const hasOpponent =
    war.opponentStars !== null && war.opponentDestruction !== null
  const maxStars = war.size * 3

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
          <Side
            label={clanName}
            stars={score.stars}
            destruction={score.destruction}
            maxStars={maxStars}
          />
          <div className="flex flex-col items-center gap-1.5">
            <OutcomeBadge outcome={outcome} />
            <span className="text-[0.7rem] text-muted-foreground tabular-nums">
              {war.size} vs {war.size}
            </span>
          </div>
          <Side
            opponent
            label={war.opponent}
            stars={hasOpponent ? war.opponentStars : null}
            destruction={hasOpponent ? war.opponentDestruction : null}
            maxStars={maxStars}
            placeholder="No score yet"
          />
        </div>

        <Separator />

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <div className="min-w-0">
            <Fact label="Attacks used">
              <OutOf value={score.attacksUsed} total={score.attacksAvailable} />
            </Fact>
            <Progress
              value={
                score.attacksAvailable > 0
                  ? (score.attacksUsed / score.attacksAvailable) * 100
                  : 0
              }
              aria-label={`${score.attacksAvailable - score.attacksUsed} attacks remaining`}
              className="mt-1 max-w-32"
            />
          </div>
          <Fact label="Bases 3-starred">
            <OutOf value={score.basesThreeStarred} total={war.size} />
          </Fact>
          <Fact label="Avg stars per attack">
            {formatNumber(summary.avgStars)}
          </Fact>
          <Fact label="Avg destruction per attack">
            {formatPercent(summary.avgDestruction)}
          </Fact>
        </dl>
      </CardContent>
    </Card>
  )
}
