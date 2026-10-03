import { CrosshairIcon, PercentIcon, StarIcon, TargetIcon } from "lucide-react"

import { StatCard } from "@/components/stat-card"
import { Progress } from "@/components/ui/progress"
import { formatNumber, formatPercent } from "@/lib/format"
import { summarize, flattenAttacks, type WarScore } from "@/lib/stats"
import type { WarDTO } from "@/lib/types"

export function WarScoreboard({
  war,
  score,
}: {
  war: WarDTO
  score: WarScore
}) {
  const summary = summarize(flattenAttacks([war]))
  const hasOpponent =
    war.opponentStars !== null && war.opponentDestruction !== null
  const remaining = score.attacksAvailable - score.attacksUsed

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Stars"
        icon={StarIcon}
        value={score.stars}
        hint={
          hasOpponent
            ? `vs ${war.opponentStars} · of ${war.size * 3}`
            : `of ${war.size * 3} possible`
        }
      />
      <StatCard
        label="Destruction"
        icon={PercentIcon}
        value={`${score.destruction.toFixed(2)}%`}
        hint={
          hasOpponent
            ? `vs ${formatPercent(war.opponentDestruction, 2)}`
            : `${score.basesThreeStarred} bases 3-starred`
        }
      />
      <StatCard
        label="Attacks used"
        icon={CrosshairIcon}
        value={
          <span>
            {score.attacksUsed}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {score.attacksAvailable}
            </span>
          </span>
        }
        hint={
          <Progress
            value={
              score.attacksAvailable > 0
                ? (score.attacksUsed / score.attacksAvailable) * 100
                : 0
            }
            aria-label={`${remaining} attacks remaining`}
            className="mt-1.5"
          />
        }
      />
      <StatCard
        label="Per attack"
        icon={TargetIcon}
        value={`${formatNumber(summary.avgStars)} ★`}
        hint={`${formatPercent(summary.avgDestruction)} avg destruction`}
      />
    </div>
  )
}
