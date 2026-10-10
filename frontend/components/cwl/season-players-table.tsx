import Link from "next/link"

import { TownHallBadge } from "@/components/badges"
import { PlayerAvatar } from "@/components/player-avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { SeasonPlayerRow } from "@/lib/cwl"
import { formatNumber, formatPercent, formatRate } from "@/lib/format"
import type { PlayerDTO } from "@/lib/types"

export function SeasonPlayersTable({
  rows,
  players,
}: {
  rows: SeasonPlayerRow[]
  players: PlayerDTO[]
}) {
  const byId = new Map(players.map((p) => [p.id, p]))
  const sorted = rows
    .flatMap((row) => {
      const player = byId.get(row.playerId)
      return player ? [{ ...row, player }] : []
    })
    .sort(
      (a, b) =>
        b.stats.totalStars - a.stats.totalStars ||
        (b.stats.avgDestruction ?? -1) - (a.stats.avgDestruction ?? -1) ||
        a.player.name.localeCompare(b.player.name)
    )

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Days</TableHead>
            <TableHead className="text-right">Benched</TableHead>
            <TableHead className="text-right">Stars</TableHead>
            <TableHead className="text-right">Avg ★</TableHead>
            <TableHead className="text-right">Avg %</TableHead>
            <TableHead className="text-right">3★ rate</TableHead>
            <TableHead className="text-right">Missed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(({ player, stats, daysInLineup, daysBenched }) => (
            <TableRow key={player.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <PlayerAvatar name={player.name} />
                  <Link
                    href={`/players/${player.id}?type=cwl`}
                    className="font-medium hover:underline"
                  >
                    {player.name}
                  </Link>
                  <TownHallBadge level={player.townHall} />
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {daysInLineup}
              </TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {daysBenched}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {stats.totalStars}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(stats.avgStars)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPercent(stats.avgDestruction)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatRate(stats.threeStarRate)}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
