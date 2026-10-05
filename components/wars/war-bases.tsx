"use client"

import { useState } from "react"
import { StarIcon } from "lucide-react"

import { AttackDialog } from "@/components/wars/attack-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { WarScore } from "@/lib/stats"
import type { PlayerDTO, WarDTO } from "@/lib/types"
import { cn } from "@/lib/utils"

/** One cell per enemy base showing the best result achieved on it. */
export function WarBases({
  war,
  players,
  score,
}: {
  war: WarDTO
  players: PlayerDTO[]
  score: WarScore
}) {
  const [target, setTarget] = useState<number | null>(null)
  const canAttack = war.roster.some(
    (entry) =>
      war.attacks.filter((a) => a.playerId === entry.playerId).length <
      war.attacksPerMember
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enemy bases</CardTitle>
        <CardDescription>
          Best result on each base. {score.basesHit} of {war.size} attacked,{" "}
          {score.basesThreeStarred} three-starred.
          {canAttack && " Click a base to log an attack on it."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
          {Array.from({ length: war.size }, (_, i) => i + 1).map((base) => {
            const stars = score.bestByBase.get(base)
            return (
              <li key={base}>
                <button
                  type="button"
                  disabled={!canAttack}
                  onClick={() => setTarget(base)}
                  aria-label={`Log an attack on base #${base}`}
                  className={cn(
                    "flex w-full flex-col items-center gap-1 rounded-md border px-2 py-1.5 text-center",
                    canAttack &&
                      "cursor-pointer transition-colors hover:bg-muted/50",
                    stars === 3 && "border-amber-400/50 bg-amber-400/10",
                    stars === undefined && "border-dashed text-muted-foreground"
                  )}
                >
                  <span className="text-xs font-medium tabular-nums">
                    #{base}
                  </span>
                  <span
                    className="flex gap-0.5"
                    role="img"
                    aria-label={
                      stars === undefined
                        ? "Not attacked"
                        : `${stars} ${stars === 1 ? "star" : "stars"}`
                    }
                  >
                    {[0, 1, 2].map((i) => (
                      <StarIcon
                        key={i}
                        aria-hidden
                        className={cn(
                          "size-3",
                          stars !== undefined && i < stars
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </CardContent>

      {target !== null && (
        <AttackDialog
          war={war}
          players={players}
          open
          onOpenChange={(open) => !open && setTarget(null)}
          targetPosition={target}
        />
      )}
    </Card>
  )
}
