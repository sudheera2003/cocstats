"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react"

import { RoleBadge, TownHallBadge } from "@/components/badges"
import { AddPlayerButton } from "@/components/players/add-player-button"
import { PlayerActionsMenu } from "@/components/players/player-actions-menu"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNumber, formatPercent, formatRate } from "@/lib/format"
import type { PlayerStats } from "@/lib/stats"
import type { PlayerDTO } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface PlayerRow {
  player: PlayerDTO
  stats: PlayerStats
  /** Average stars per attack in each real war type, for the Overall view. */
  split?: { regular: number | null; cwl: number | null }
}

type SortKey =
  | "name"
  | "townHall"
  | "wars"
  | "attacks"
  | "avgStars"
  | "regularStars"
  | "cwlStars"
  | "avgDestruction"
  | "threeStarRate"
  | "maxDestruction"
  | "minDestruction"
  | "missed"

const COLUMNS: {
  key: SortKey
  label: string
  numeric?: boolean
  /** Only shown on the Overall view, where Regular and CWL are added together. */
  splitOnly?: boolean
  value: (row: PlayerRow) => string | number | null
}[] = [
  { key: "name", label: "Player", value: (r) => r.player.name.toLowerCase() },
  {
    key: "townHall",
    label: "TH",
    numeric: true,
    value: (r) => r.player.townHall,
  },
  { key: "wars", label: "Wars", numeric: true, value: (r) => r.stats.wars },
  {
    key: "attacks",
    label: "Attacks",
    numeric: true,
    value: (r) => r.stats.attacks,
  },
  {
    key: "avgStars",
    label: "Avg ★",
    numeric: true,
    value: (r) => r.stats.avgStars,
  },
  {
    key: "regularStars",
    label: "Regular ★",
    numeric: true,
    splitOnly: true,
    value: (r) => r.split?.regular ?? null,
  },
  {
    key: "cwlStars",
    label: "CWL ★",
    numeric: true,
    splitOnly: true,
    value: (r) => r.split?.cwl ?? null,
  },
  {
    key: "avgDestruction",
    label: "Avg %",
    numeric: true,
    value: (r) => r.stats.avgDestruction,
  },
  {
    key: "threeStarRate",
    label: "3★ rate",
    numeric: true,
    value: (r) => r.stats.threeStarRate,
  },
  {
    key: "maxDestruction",
    label: "Best %",
    numeric: true,
    value: (r) => r.stats.maxDestruction,
  },
  {
    key: "minDestruction",
    label: "Worst %",
    numeric: true,
    value: (r) => r.stats.minDestruction,
  },
  {
    key: "missed",
    label: "Missed",
    numeric: true,
    value: (r) => r.stats.missed,
  },
]

function compare(
  a: string | number | null,
  b: string | number | null,
  direction: 1 | -1
) {
  // Players without data always sink to the bottom, whichever way we sort.
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  if (typeof a === "string" || typeof b === "string") {
    return String(a).localeCompare(String(b)) * direction
  }
  return (a - b) * direction
}

export function PlayersTable({
  rows,
  showSplit = false,
}: {
  rows: PlayerRow[]
  /** Add Regular and CWL average-star columns beside the overall figures. */
  showSplit?: boolean
}) {
  const columns = COLUMNS.filter((column) => showSplit || !column.splitOnly)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<{ key: SortKey; direction: 1 | -1 }>({
    key: "avgStars",
    direction: -1,
  })

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const column = COLUMNS.find((c) => c.key === sort.key)!
    return rows
      .filter(
        ({ player }) =>
          needle === "" ||
          player.name.toLowerCase().includes(needle) ||
          (player.tag ?? "").toLowerCase().includes(needle)
      )
      .sort(
        (a, b) =>
          Number(b.player.active) - Number(a.player.active) ||
          compare(column.value(a), column.value(b), sort.direction) ||
          a.player.name.localeCompare(b.player.name)
      )
  }, [rows, query, sort])

  if (rows.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>No players yet</EmptyTitle>
          <EmptyDescription>
            Add your clan members first, then pick them when you start a war.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <AddPlayerButton />
        </EmptyContent>
      </Empty>
    )
  }

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 1 ? -1 : 1 }
        : { key, direction: key === "name" ? 1 : -1 }
    )
  }

  return (
    <div className="space-y-3">
      <InputGroup className="max-w-xs">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search name or tag"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search players"
        />
      </InputGroup>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const active = sort.key === column.key
                const Icon = !active
                  ? ChevronsUpDownIcon
                  : sort.direction === 1
                    ? ArrowUpIcon
                    : ArrowDownIcon
                return (
                  <TableHead
                    key={column.key}
                    aria-sort={
                      active
                        ? sort.direction === 1
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={cn(column.numeric && "text-right")}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {column.label}
                      <Icon className="size-3" />
                    </button>
                  </TableHead>
                )
              })}
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-20 text-center text-muted-foreground"
                >
                  No players match “{query}”.
                </TableCell>
              </TableRow>
            )}
            {visible.map(({ player, stats, split }) => (
              <TableRow
                key={player.id}
                className={cn(!player.active && "text-muted-foreground")}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/players/${player.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {player.name}
                      </Link>
                      {player.tag && (
                        <div className="font-mono text-[0.7rem] text-muted-foreground">
                          {player.tag}
                        </div>
                      )}
                    </div>
                    <RoleBadge role={player.role} />
                    {!player.active && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <TownHallBadge level={player.townHall} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {stats.wars}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {stats.attacks}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatNumber(stats.avgStars)}
                </TableCell>
                {showSplit && (
                  <>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatNumber(split?.regular ?? null)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatNumber(split?.cwl ?? null)}
                    </TableCell>
                  </>
                )}
                <TableCell className="text-right tabular-nums">
                  {formatPercent(stats.avgDestruction)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatRate(stats.threeStarRate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(stats.maxDestruction, 0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(stats.minDestruction, 0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {stats.missed > 0 ? (
                    <span className="font-medium text-rose-600 dark:text-rose-400">
                      {stats.missed}
                    </span>
                  ) : (
                    stats.missed
                  )}
                </TableCell>
                <TableCell>
                  <PlayerActionsMenu player={player} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
