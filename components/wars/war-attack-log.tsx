import Link from "next/link"
import { SwordsIcon } from "lucide-react"

import { EnemyTownHall } from "@/components/badges"
import { LocalTime } from "@/components/local-time"
import { Stars } from "@/components/stars"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDuration, formatOffset } from "@/lib/format"
import type { PlayerDTO, WarDTO } from "@/lib/types"

export function WarAttackLog({
  war,
  players,
}: {
  war: WarDTO
  players: PlayerDTO[]
}) {
  if (war.attacks.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SwordsIcon />
          </EmptyMedia>
          <EmptyTitle>No attacks yet</EmptyTitle>
          <EmptyDescription>
            Attacks appear here in the order they happened.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const names = new Map(players.map((p) => [p.id, p.name]))
  const attackerTownHalls = new Map(
    war.roster.map((entry) => [entry.playerId, entry.townHall])
  )
  const attacks = [...war.attacks].sort(
    (a, b) => Date.parse(a.attackedAt) - Date.parse(b.attackedAt)
  )

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Attack</TableHead>
            <TableHead className="text-right">Base</TableHead>
            <TableHead>Enemy TH</TableHead>
            <TableHead>Result</TableHead>
            <TableHead className="text-right">Destruction</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attacks.map((attack) => (
            <TableRow key={attack.id}>
              <TableCell>
                <div className="flex flex-col">
                  <LocalTime iso={attack.attackedAt} />
                  <span className="text-[0.7rem] text-muted-foreground">
                    {formatOffset(war.startedAt, attack.attackedAt)} from start
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/players/${attack.playerId}`}
                  className="font-medium hover:underline"
                >
                  {names.get(attack.playerId) ?? "Unknown"}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {attack.order}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                #{attack.targetPosition}
              </TableCell>
              <TableCell>
                <EnemyTownHall
                  attacker={attackerTownHalls.get(attack.playerId)}
                  enemy={attack.targetTownHall}
                />
              </TableCell>
              <TableCell>
                <Stars value={attack.stars} />
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {attack.destruction}%
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatDuration(attack.durationSec)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
