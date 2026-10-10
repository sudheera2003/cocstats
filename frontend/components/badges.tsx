import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  ROLE_LABELS,
  WAR_TYPE_META,
  type PlayerRole,
  type WarType,
} from "@/lib/constants"
import type { Matchup, WarOutcome } from "@/lib/stats"
import { cn } from "@/lib/utils"

export function WarTypeBadge({
  type,
  day,
  className,
}: {
  type: WarType
  day?: number | null
  className?: string
}) {
  return (
    <Badge variant="outline" className={className}>
      {WAR_TYPE_META[type].short}
      {day ? ` · Day ${day}` : ""}
    </Badge>
  )
}

/** The Town Hall of an attacked base, with an arrow when it was above or below the attacker's. */
export function EnemyTownHall({
  direction = "same",
  enemy,
}: {
  /** Whether the base was ranked above, level with or below the attacker. */
  direction?: Matchup
  enemy: number | null
}) {
  if (enemy === null) return <span className="text-muted-foreground">—</span>
  return (
    <span
      className="inline-flex items-center gap-0.5 tabular-nums"
      title={
        direction === "up"
          ? "Hit a base ranked above them"
          : direction === "down"
            ? "Hit a base ranked below them"
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

/** One colour per war result, shared by badges, form strips and day cards. */
export const OUTCOME_META: Record<
  WarOutcome,
  { label: string; badge: string; dot: string; text: string }
> = {
  win: {
    label: "Win",
    badge:
      "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  loss: {
    label: "Loss",
    badge: "border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-400",
  },
  tie: {
    label: "Tie",
    badge: "border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-400",
  },
  ongoing: {
    label: "Ongoing",
    badge:
      "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
  },
  unrecorded: {
    label: "Ended",
    badge: "border-transparent bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
    text: "text-muted-foreground",
  },
}

export function OutcomeBadge({
  outcome,
  preparing = false,
}: {
  outcome: WarOutcome
  /** An ongoing war that's still on preparation day. */
  preparing?: boolean
}) {
  const { label, badge, dot } = OUTCOME_META[outcome]
  return (
    <Badge variant="outline" className={badge}>
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          dot,
          outcome === "ongoing" && !preparing && "animate-pulse"
        )}
      />
      {preparing ? "Preparation" : label}
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
