"use client"

import { useState } from "react"
import { toast } from "sonner"

import { RosterPicker } from "@/components/wars/roster-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useFormAction } from "@/hooks/use-form-action"
import { updateRoster } from "@/lib/actions/wars"
import type { PlayerDTO, WarDTO } from "@/lib/types"
import { rosterSchema } from "@/lib/validation"

function RosterForm({
  war,
  players,
  onDone,
}: {
  war: WarDTO
  players: PlayerDTO[]
  onDone: () => void
}) {
  const [playerIds, setPlayerIds] = useState(war.roster.map((r) => r.playerId))
  const { pending, errors, submit, clearError } = useFormAction()

  const inRoster = new Set(war.roster.map((r) => r.playerId))
  const pickable = players.filter((p) => p.active || inRoster.has(p.id))
  const locked = new Set(war.attacks.map((a) => a.playerId))

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    submit(
      rosterSchema,
      { warId: war.id, playerIds },
      (data) => updateRoster(data),
      () => {
        toast.success("Roster updated")
        onDone()
      }
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <RosterPicker
        players={pickable}
        selected={playerIds}
        onChange={(ids) => {
          setPlayerIds(ids)
          clearError("playerIds")
        }}
        max={war.size}
        locked={locked}
        error={errors.playerIds}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          Save roster
        </Button>
      </DialogFooter>
    </form>
  )
}

export function RosterDialog({
  war,
  players,
  open,
  onOpenChange,
}: {
  war: WarDTO
  players: PlayerDTO[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit roster</DialogTitle>
          <DialogDescription>
            Players who already have attacks logged are locked in. Delete their
            attacks first to remove them.
          </DialogDescription>
        </DialogHeader>
        <RosterForm
          war={war}
          players={players}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
