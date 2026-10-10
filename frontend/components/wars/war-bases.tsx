import { StarIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { WarScore } from "@/lib/stats"
import type { WarDTO } from "@/lib/types"
import { cn } from "@/lib/utils"

/** One cell per enemy base showing the best result achieved on it. */
export function WarBases({ war, score }: { war: WarDTO; score: WarScore }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enemy bases</CardTitle>
        <CardDescription>
          Best result on each base. {score.basesHit} of {war.size} attacked,{" "}
          {score.basesThreeStarred} three-starred.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
          {war.enemyBases.map((base) => {
            const stars = score.bestByBase.get(base.position)
            return (
              <li
                key={base.tag}
                className={cn(
                  "flex flex-col gap-1 rounded-md border px-2.5 py-2",
                  stars === 3 && "border-amber-400/50 bg-amber-400/10",
                  stars === undefined && "border-dashed text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                  <span className="font-medium">#{base.position}</span>
                  <span className="text-muted-foreground">
                    TH{base.townHall}
                  </span>
                </div>
                <div className="truncate text-xs" title={base.name}>
                  {base.name}
                </div>
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
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
