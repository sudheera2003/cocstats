"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  EyeOffIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { PlayerDialog } from "@/components/players/player-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deletePlayer, setPlayerActive } from "@/lib/actions/players"
import type { PlayerDTO } from "@/lib/types"

export function PlayerActionsMenu({
  player,
  onDeleted,
}: {
  player: PlayerDTO
  onDeleted?: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  function toggleActive() {
    startTransition(async () => {
      try {
        const result = await setPlayerActive(player.id, !player.active)
        if (result.ok) {
          toast.success(
            player.active
              ? `${player.name} marked as inactive`
              : `${player.name} is active again`
          )
        } else {
          toast.error(result.error)
        }
      } catch {
        toast.error("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${player.name}`}
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={toggleActive}>
            {player.active ? (
              <>
                <EyeOffIcon /> Mark as inactive
              </>
            ) : (
              <>
                <EyeIcon /> Mark as active
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2Icon /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PlayerDialog
        player={player}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${player.name}?`}
        description="This permanently removes the player. Players who have been in a war can't be deleted, mark them inactive instead."
        successMessage={`${player.name} deleted`}
        onConfirm={() => deletePlayer(player.id)}
        onSuccess={() => (onDeleted ? onDeleted() : router.refresh())}
      />
    </>
  )
}

/** Actions menu for the player's own page: leaves the page once they're deleted. */
export function PlayerPageActions({ player }: { player: PlayerDTO }) {
  const router = useRouter()
  return (
    <PlayerActionsMenu
      player={player}
      onDeleted={() => router.push("/players")}
    />
  )
}
