import Link from "next/link"

import { TownHallBadge } from "@/components/badges"
import { PlayerAvatar } from "@/components/player-avatar"
import { Stars } from "@/components/stars"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDuration, formatPercent } from "@/lib/format"
import { rankMatchup } from "@/lib/stats"
import type { AttackDTO, WarDTO } from "@/lib/types"

function AttackCell({
  attack,
  position,
}: {
  attack: AttackDTO
  /** The attacker's own map position. */
  position: number
}) {
  const { direction } = rankMatchup(
    { low: position, high: position },
    attack.targetPosition
  )
  const details = [
    `Base #${attack.targetPosition}`,
    attack.targetTownHall !== null
      ? `TH${attack.targetTownHall}${
          direction === "up" ? " ↑" : direction === "down" ? " ↓" : ""
        }`
      : null,
    attack.durationSec !== null ? formatDuration(attack.durationSec) : null,
  ].filter(Boolean)

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <Stars value={attack.stars} />
        <span className="font-medium tabular-nums">{attack.destruction}%</span>
      </div>
      <div
        className="text-[0.7rem] text-muted-foreground"
        title={attack.targetName ?? undefined}
      >
        {details.join(" · ")}
      </div>
    </div>
  )
}

/** Our lineup in map order, with what each player did with their attacks. */
export function WarRosterTable({ war }: { war: WarDTO }) {
  const rows = [...war.roster]
    .sort((a, b) => a.position - b.position)
    .map((entry) => ({
      entry,
      attacks: war.attacks
        .filter((a) => a.playerId === entry.playerId)
        .sort((a, b) => a.order - b.order),
    }))
  const slots = Array.from({ length: war.attacksPerMember }, (_, i) => i)

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-right">#</TableHead>
            <TableHead>Player</TableHead>
            {slots.map((i) => (
              <TableHead key={i}>Attack {i + 1}</TableHead>
            ))}
            <TableHead className="text-right">Stars</TableHead>
            <TableHead className="text-right">Avg %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ entry, attacks }) => {
            const stars = attacks.reduce((sum, a) => sum + a.stars, 0)
            const avg =
              attacks.length > 0
                ? attacks.reduce((sum, a) => sum + a.destruction, 0) /
                  attacks.length
                : null
            return (
              <TableRow key={entry.playerId}>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {entry.position}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <PlayerAvatar name={entry.name} />
                    <Link
                      href={`/players/${entry.playerId}`}
                      className="font-medium hover:underline"
                    >
                      {entry.name}
                    </Link>
                    <TownHallBadge level={entry.townHall} />
                  </div>
                </TableCell>
                {slots.map((i) => (
                  <TableCell key={i} className="align-middle">
                    {attacks[i] ? (
                      <AttackCell
                        attack={attacks[i]}
                        position={entry.position}
                      />
                    ) : war.status === "ended" ? (
                      <Badge
                        variant="outline"
                        className="border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-400"
                      >
                        Missed
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">
                        {war.phase === "battle" ? "Not used yet" : "—"}
                      </span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium tabular-nums">
                  {stars}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPercent(avg)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
