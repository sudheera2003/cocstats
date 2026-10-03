"use client"

import Link from "next/link"
import { useState } from "react"
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { TownHallBadge } from "@/components/badges"
import { Stars } from "@/components/stars"
import { AttackDialog } from "@/components/wars/attack-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteAttack } from "@/lib/actions/wars"
import { formatDuration, formatOffset, formatPercent } from "@/lib/format"
import type { AttackDTO, PlayerDTO, WarDTO } from "@/lib/types"

function AttackCell({
  war,
  attack,
  attackerTownHall,
  onEdit,
  onDelete,
}: {
  war: WarDTO
  attack: AttackDTO
  attackerTownHall: number
  onEdit: () => void
  onDelete: () => void
}) {
  const details = [
    `Base #${attack.targetPosition}`,
    attack.targetTownHall !== null
      ? `TH${attack.targetTownHall}${
          attack.targetTownHall > attackerTownHall
            ? " ↑"
            : attack.targetTownHall < attackerTownHall
              ? " ↓"
              : ""
        }`
      : null,
    attack.durationSec !== null ? formatDuration(attack.durationSec) : null,
    formatOffset(war.startedAt, attack.attackedAt),
  ].filter(Boolean)

  return (
    <div className="flex items-center gap-2">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Stars value={attack.stars} />
          <span className="font-medium tabular-nums">
            {attack.destruction}%
          </span>
        </div>
        <div className="text-[0.7rem] text-muted-foreground">
          {details.join(" · ")}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="Attack actions">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={onEdit}>
            <PencilIcon /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2Icon /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function WarRosterTable({
  war,
  players,
}: {
  war: WarDTO
  players: PlayerDTO[]
}) {
  const [dialog, setDialog] = useState<{
    playerId?: string
    attack?: AttackDTO
  } | null>(null)
  const [deleting, setDeleting] = useState<AttackDTO | null>(null)

  const playersById = new Map(players.map((p) => [p.id, p]))
  const rows = war.roster
    .flatMap((entry) => {
      const player = playersById.get(entry.playerId)
      return player
        ? [
            {
              entry,
              player,
              attacks: war.attacks
                .filter((a) => a.playerId === entry.playerId)
                .sort((a, b) => a.order - b.order),
            },
          ]
        : []
    })
    .sort(
      (a, b) =>
        b.entry.townHall - a.entry.townHall ||
        a.player.name.localeCompare(b.player.name)
    )
  const slots = Array.from({ length: war.attacksPerMember }, (_, i) => i)

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              {slots.map((i) => (
                <TableHead key={i}>Attack {i + 1}</TableHead>
              ))}
              <TableHead className="text-right">Stars</TableHead>
              <TableHead className="text-right">Avg %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ entry, player, attacks }) => {
              const stars = attacks.reduce((sum, a) => sum + a.stars, 0)
              const avg =
                attacks.length > 0
                  ? attacks.reduce((sum, a) => sum + a.destruction, 0) /
                    attacks.length
                  : null
              return (
                <TableRow key={player.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/players/${player.id}`}
                        className="font-medium hover:underline"
                      >
                        {player.name}
                      </Link>
                      <TownHallBadge level={entry.townHall} />
                    </div>
                  </TableCell>
                  {slots.map((i) => {
                    const attack = attacks[i]
                    return (
                      <TableCell key={i} className="align-middle">
                        {attack ? (
                          <AttackCell
                            war={war}
                            attack={attack}
                            attackerTownHall={entry.townHall}
                            onEdit={() => setDialog({ attack })}
                            onDelete={() => setDeleting(attack)}
                          />
                        ) : i === attacks.length ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDialog({ playerId: player.id })}
                            >
                              <PlusIcon /> Log
                            </Button>
                            {war.status === "ended" && (
                              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                                Missed
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )
                  })}
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

      {dialog && (
        <AttackDialog
          war={war}
          players={players}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          playerId={dialog.playerId}
          attack={dialog.attack}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this attack?"
        description={
          deleting
            ? `${playersById.get(deleting.playerId)?.name ?? "This player"}'s attack ${deleting.order} (${deleting.stars}★, ${deleting.destruction}%) will be removed from the war and their stats.`
            : ""
        }
        successMessage="Attack deleted"
        onConfirm={() => deleteAttack(war.id, deleting!.id)}
      />
    </>
  )
}
