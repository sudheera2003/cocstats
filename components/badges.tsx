import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  ROLE_LABELS,
  WAR_TYPE_META,
  type PlayerRole,
  type WarType,
} from "@/lib/constants"
import { matchupDirection } from "@/lib/format"
import type { WarOutcome } from "@/lib/stats"
import { cn } from "@/lib/utils"

export function WarTypeBadge({
  type,
  day,
}: {
  type: WarType
  day?: number | null
}) {
  return (
    <Badge variant="outline">
      {WAR_TYPE_META[type].short}
      {day ? ` · Day ${day}` : ""}
    </Badge>
  )
}

/** The Town Hall of an attacked base, with an arrow when it was above or below the attacker's. */
export function EnemyTownHall({
  attacker,
  enemy,
}: {
  attacker?: number
  enemy: number | null
}) {
  if (enemy === null) return <span className="text-muted-foreground">—</span>
  const direction = attacker ? matchupDirection(attacker, enemy) : "same"
  return (
    <span
      className="inline-flex items-center gap-0.5 tabular-nums"
      title={
        direction === "up"
          ? "Hit a higher Town Hall"
          : direction === "down"
            ? "Hit a lower Town Hall"
            : undefined
      }
    >
      TH{enemy}
      {direction === "up" && (
        <ArrowUpIcon className="size-3 text-amber-600 dark:text-amber-400" />
      )}
      {direction === "down" && (
        <ArrowDownIcon className="size-3 text-muted-foreground" />
      )}
    </span>
  )
}

const OUTCOME_STYLES: Record<WarOutcome, { label: string; className: string }> =
  {
    win: {
      label: "Win",
      className:
        "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    },
    loss: {
      label: "Loss",
      className:
        "border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-400",
    },
    tie: {
      label: "Tie",
      className:
        "border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-400",
    },
    ongoing: {
      label: "Ongoing",
      className:
        "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
    },
    unrecorded: {
      label: "Ended",
      className: "border-transparent bg-muted text-muted-foreground",
    },
  }

export function OutcomeBadge({ outcome }: { outcome: WarOutcome }) {
  const { label, className } = OUTCOME_STYLES[outcome]
  return (
    <Badge variant="outline" className={cn(className)}>
      {label}
    </Badge>
  )
}

export function TownHallBadge({ level }: { level: number }) {
  return (
    <Badge variant="secondary" className="tabular-nums">
      TH{level}
    </Badge>
  )
}

export function RoleBadge({ role }: { role: PlayerRole }) {
  if (role === "member") return null
  return <Badge variant="outline">{ROLE_LABELS[role]}</Badge>
}
