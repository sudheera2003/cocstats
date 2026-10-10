import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { OutcomeBadge, WarTypeBadge } from "@/components/badges"
import { LocalTime } from "@/components/local-time"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatPercent } from "@/lib/format"
import { warScore } from "@/lib/stats"
import type { WarDTO } from "@/lib/types"

/** A war that's being prepared or fought, with a shortcut to its page. */
export function LiveWarCard({ war }: { war: WarDTO }) {
  const score = warScore(war)
  const used =
    score.attacksAvailable > 0
      ? (score.attacksUsed / score.attacksAvailable) * 100
      : 0

  return (
    <Card
      size="sm"
      className="bg-linear-to-r from-amber-500/10 via-card to-card ring-amber-500/30"
    >
      <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="min-w-0 flex-1 basis-48 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <OutcomeBadge
              outcome="ongoing"
              preparing={war.phase === "preparation"}
            />
            <WarTypeBadge type={war.type} day={war.day} />
            {war.phase === "preparation" ? (
              <span>
                battle day starts <LocalTime iso={war.startedAt} />
              </span>
            ) : (
              <span>
                ends <LocalTime iso={war.endsAt} />
              </span>
            )}
          </div>
          <div className="truncate font-heading text-base font-semibold">
            vs {war.opponent}
          </div>
        </div>

        <dl className="flex items-start gap-6 tabular-nums">
          <div>
            <dt className="text-[0.7rem] text-muted-foreground">Stars</dt>
            <dd className="font-heading text-lg font-semibold">
              {score.stars}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                / {war.size * 3}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[0.7rem] text-muted-foreground">Destruction</dt>
            <dd className="font-heading text-lg font-semibold">
              {formatPercent(score.destruction)}
            </dd>
          </div>
          <div className="w-28">
            <dt className="text-[0.7rem] text-muted-foreground">Attacks</dt>
            <dd className="font-heading text-lg font-semibold">
              {score.attacksUsed}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                / {score.attacksAvailable}
              </span>
            </dd>
            <Progress
              value={used}
              aria-label={`${score.attacksUsed} of ${score.attacksAvailable} attacks used`}
              className="mt-1"
            />
          </div>
        </dl>

        <Button asChild>
          <Link href={`/wars/${war.id}`}>
            Open war <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
