import Link from "next/link"
import { SwordsIcon } from "lucide-react"

import { EnemyTownHall } from "@/components/badges"
import { PlayerAvatar } from "@/components/player-avatar"
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
import { formatDuration } from "@/lib/format"
import { attackerRankRange, rankMatchup } from "@/lib/stats"
import type { WarDTO } from "@/lib/types"

export function WarAttackLog({ war }: { war: WarDTO }) {
  if (war.attacks.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SwordsIcon />
          </EmptyMedia>
          <EmptyTitle>No attacks yet</EmptyTitle>
          <EmptyDescription>
            {war.phase === "preparation"
              ? "Battle day hasn't started."
              : "Attacks appear here in the order they happened."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const names = new Map(war.roster.map((entry) => [entry.playerId, entry.name]))
  const attacks = [...war.attacks].sort((a, b) => a.sequence - b.sequence)

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Attack</TableHead>
            <TableHead>Base</TableHead>
            <TableHead>Enemy TH</TableHead>
            <TableHead>Result</TableHead>
            <TableHead className="text-right">Destruction</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attacks.map((attack) => {
            const name = names.get(attack.playerId) ?? "Unknown"
            return (
              <TableRow key={attack.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <PlayerAvatar name={name} />
                    <Link
                      href={`/players/${attack.playerId}`}
                      className="font-medium hover:underline"
                    >
                      {name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {attack.order}
                </TableCell>
                <TableCell>
                  <span className="tabular-nums">#{attack.targetPosition}</span>
                  {attack.targetName && (
                    <span className="text-muted-foreground">
                      {" "}
                      {attack.targetName}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <EnemyTownHall
                    direction={
                      rankMatchup(
                        attackerRankRange(war.roster, attack.playerId),
                        attack.targetPosition
                      ).direction
                    }
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
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
