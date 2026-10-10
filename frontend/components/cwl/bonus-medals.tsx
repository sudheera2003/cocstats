"use client"

import Link from "next/link"
import { useState } from "react"
import { InfoIcon, MedalIcon } from "lucide-react"

import { TownHallBadge } from "@/components/badges"
import { PlayerAvatar } from "@/components/player-avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MAX_CWL_ROSTER } from "@/lib/constants"
import {
  defaultBonusSlots,
  type AwardLine,
  type AwardMetrics,
  type AwardWeights,
} from "@/lib/awards"
import { cn } from "@/lib/utils"

export interface MedalRow {
  playerId: string
  name: string
  townHall: number
  points: number
  metrics: AwardMetrics
  breakdown: AwardLine[]
  reasons: string[]
  regularMedalPercent: number
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

function PointsCell({ row }: { row: MedalRow }) {
  const lines = row.breakdown.filter((line) => line.points !== 0)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cursor-help rounded-sm font-medium underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {row.points}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="min-w-52">
        <p className="mb-1 font-medium">{row.name}</p>
        <ul className="space-y-0.5 tabular-nums">
          {lines.map((line) => (
            <li key={line.key} className="flex justify-between gap-4">
              <span>
                {line.label} <span className="opacity-70">×{line.count}</span>
              </span>
              <span>{signed(line.points)}</span>
            </li>
          ))}
          <li className="mt-1 flex justify-between gap-4 border-t pt-1 font-medium">
            <span>Total</span>
            <span>{row.points}</span>
          </li>
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}

function HowPointsWork({ weights }: { weights: AwardWeights }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <InfoIcon className="size-3.5" /> How points work
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-2 text-xs">
        <p className="font-medium">What earns points</p>
        <ul className="space-y-1 tabular-nums">
          <li>Each star: +{weights.star}</li>
          <li>Each attack used: +{weights.attackUsed}</li>
          <li>
            Each hit-up (a base ranked above yours): +{weights.hitUp}, then +
            {weights.hitUpPosition} per position above
          </li>
          <li>Each star earned on a hit-up: +{weights.hitUpStar} extra</li>
          <li>Each triple (3 stars): +{weights.triple} extra</li>
          <li>Each star on a lower-ranked base: −{weights.hitDownStar}</li>
          <li>Each attack missed in a finished day: −{weights.missedAttack}</li>
        </ul>
        <p className="text-muted-foreground">
          Ties go to more stars, then fewer missed attacks, then higher average
          destruction. Hover a score to see where it came from. Only players who
          attacked at least once are ranked.
        </p>
      </PopoverContent>
    </Popover>
  )
}

export function BonusMedals({
  rows,
  noAttackNames,
  wins,
  completed,
  totalDays,
  weights,
}: {
  rows: MedalRow[]
  noAttackNames: string[]
  wins: number
  completed: number
  totalDays: number
  weights: AwardWeights
}) {
  const [slotsInput, setSlotsInput] = useState(String(defaultBonusSlots(wins)))
  const parsed = Number(slotsInput)
  const slots =
    slotsInput === "" || !Number.isFinite(parsed)
      ? 0
      : Math.min(MAX_CWL_ROSTER, Math.max(0, Math.floor(parsed)))
  const isFinal = completed >= totalDays

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Bonus medals
          <Badge variant={isFinal ? "secondary" : "outline"}>
            {isFinal
              ? "Final"
              : `Provisional · ${completed} of ${totalDays} days finished`}
          </Badge>
        </CardTitle>
        <CardDescription>
          Who has earned the leader&apos;s bonus medals most, judged on stars,
          attacks used and how often they hit above their rank.
        </CardDescription>
        <CardAction>
          <HowPointsWork weights={weights} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field className="max-w-xs">
          <FieldLabel htmlFor="bonus-slots">
            Bonus medals to give out
          </FieldLabel>
          <Input
            id="bonus-slots"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_CWL_ROSTER}
            value={slotsInput}
            onChange={(e) => setSlotsInput(e.target.value)}
          />
          <FieldDescription>
            Each war won unlocks one, and you won {wins}. If your game shows a
            different number, enter it here.
          </FieldDescription>
        </Field>

        {rows.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Suggestions appear once attacks are logged.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-right">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Stars</TableHead>
                  <TableHead className="text-right">Attacks</TableHead>
                  <TableHead className="text-right">Hit-ups</TableHead>
                  <TableHead className="text-right">Triples</TableHead>
                  <TableHead className="text-right">Missed</TableHead>
                  <TableHead className="text-right">Regular medals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => {
                  const deserves = index < slots
                  const { metrics } = row
                  return (
                    <TableRow
                      key={row.playerId}
                      className={cn(
                        deserves && "bg-amber-400/10 hover:bg-amber-400/15",
                        index === slots &&
                          slots > 0 &&
                          "border-t-2 border-t-amber-400/50"
                      )}
                    >
                      <TableCell className="text-right tabular-nums">
                        {deserves ? (
                          <span className="inline-flex items-center justify-end gap-1 font-medium">
                            <MedalIcon
                              className="size-3.5 text-amber-500"
                              aria-label="Deserves a bonus medal"
                            />
                            {index + 1}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {index + 1}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <PlayerAvatar name={row.name} />
                          <Link
                            href={`/players/${row.playerId}?type=cwl`}
                            className="font-medium hover:underline"
                          >
                            {row.name}
                          </Link>
                          <TownHallBadge level={row.townHall} />
                        </div>
                        <p className="mt-0.5 max-w-64 pl-8 text-[0.7rem] leading-snug whitespace-normal text-muted-foreground">
                          {row.reasons.join(" · ")}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <PointsCell row={row} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {metrics.stars}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {metrics.attacksUsed}/{metrics.daysInLineup}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {metrics.hitUps > 0 ? (
                          <span
                            title={`${metrics.hitUpStars}★ earned on hit-ups`}
                          >
                            {metrics.hitUps}{" "}
                            <span className="text-muted-foreground">
                              ({metrics.hitUpStars}★)
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {metrics.threeStars}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {metrics.missed > 0 ? (
                          <span className="font-medium text-rose-600 dark:text-rose-400">
                            {metrics.missed}
                          </span>
                        ) : (
                          metrics.missed
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.regularMedalPercent}%
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {slots > 0
            ? `The top ${Math.min(slots, rows.length)} ${slots === 1 ? "player is" : "players are"} highlighted. `
            : "Set a number above to highlight who should get them. "}
          Regular medals are separate and automatic: 20% for being on the roster
          plus 10% per star, full at 8★.
          {noAttackNames.length > 0 &&
            ` ${noAttackNames.length} registered ${noAttackNames.length === 1 ? "player" : "players"} made no attacks and ${noAttackNames.length === 1 ? "isn't" : "aren't"} ranked.`}
        </p>
      </CardContent>
    </Card>
  )
}
