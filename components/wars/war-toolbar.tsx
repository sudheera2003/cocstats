"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  FlagIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { AttackDialog } from "@/components/wars/attack-dialog"
import { EditWarDialog } from "@/components/wars/edit-war-dialog"
import { RosterDialog } from "@/components/wars/roster-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteWar, updateWar } from "@/lib/actions/wars"
import type { PlayerDTO, WarDTO } from "@/lib/types"

export function WarToolbar({
  war,
  players,
  lineupPlayers = players,
  backHref = "/wars",
}: {
  war: WarDTO
  players: PlayerDTO[]
  /** Who can be picked for the lineup: everyone, or just the CWL season roster. */
  lineupPlayers?: PlayerDTO[]
  /** Where to go once the war is deleted. */
  backHref?: string
}) {
  const router = useRouter()
  const [attackOpen, setAttackOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [, startTransition] = useTransition()

  const canAttack = war.roster.some(
    (entry) =>
      war.attacks.filter((a) => a.playerId === entry.playerId).length <
      war.attacksPerMember
  )

  function reopen() {
    startTransition(async () => {
      try {
        const result = await updateWar({
          warId: war.id,
          opponent: war.opponent,
          type: war.type,
          size: war.size,
          attacksPerMember: war.attacksPerMember,
          notes: war.notes,
          startedAt: war.startedAt,
          ended: false,
          opponentStars: null,
          opponentDestruction: null,
        })
        if (result.ok) toast.success("War reopened")
        else toast.error(result.error)
      } catch {
        toast.error("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <>
      <Button onClick={() => setAttackOpen(true)} disabled={!canAttack}>
        <PlusIcon /> Log attack
      </Button>
      {war.status === "ongoing" && (
        <Button variant="outline" onClick={() => setEndOpen(true)}>
          <FlagIcon /> End war
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More actions">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon /> Edit details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setRosterOpen(true)}>
            <UsersIcon /> Edit roster
          </DropdownMenuItem>
          {war.status === "ended" && (
            <DropdownMenuItem onSelect={reopen}>
              <RotateCcwIcon /> Reopen war
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2Icon /> Delete war
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AttackDialog
        war={war}
        players={players}
        open={attackOpen}
        onOpenChange={setAttackOpen}
      />
      <EditWarDialog war={war} open={editOpen} onOpenChange={setEditOpen} />
      <EditWarDialog
        war={war}
        endWar
        open={endOpen}
        onOpenChange={setEndOpen}
      />
      <RosterDialog
        war={war}
        players={lineupPlayers}
        open={rosterOpen}
        onOpenChange={setRosterOpen}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete the war against ${war.opponent}?`}
        description={`This permanently removes the war and its ${war.attacks.length} logged attack${war.attacks.length === 1 ? "" : "s"}. Player stats will be recalculated.`}
        successMessage="War deleted"
        onConfirm={() => deleteWar(war.id)}
        onSuccess={() => router.push(backHref)}
      />
    </>
  )
}
