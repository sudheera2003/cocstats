"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useFormAction } from "@/hooks/use-form-action"
import { createPlayer, updatePlayer } from "@/lib/actions/players"
import {
  MAX_TOWN_HALL,
  PLAYER_ROLES,
  ROLE_LABELS,
  type PlayerRole,
} from "@/lib/constants"
import type { PlayerDTO } from "@/lib/types"
import { playerSchema } from "@/lib/validation"

const TOWN_HALLS = Array.from(
  { length: MAX_TOWN_HALL },
  (_, i) => MAX_TOWN_HALL - i
)

function PlayerForm({
  player,
  onDone,
}: {
  player?: PlayerDTO
  onDone: () => void
}) {
  const [name, setName] = useState(player?.name ?? "")
  const [tag, setTag] = useState(player?.tag ?? "")
  const [townHall, setTownHall] = useState<string>(
    player ? String(player.townHall) : ""
  )
  const [role, setRole] = useState<PlayerRole>(player?.role ?? "member")
  const { pending, errors, submit, clearError } = useFormAction()

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const values = {
      name,
      tag,
      townHall: townHall === "" ? undefined : Number(townHall),
      role,
    }
    submit(
      playerSchema,
      values,
      (data) => (player ? updatePlayer(player.id, data) : createPlayer(data)),
      () => {
        toast.success(player ? "Player updated" : `${name.trim()} added`)
        onDone()
      }
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="player-name">In-game name</FieldLabel>
          <Input
            id="player-name"
            value={name}
            maxLength={32}
            autoFocus
            aria-invalid={!!errors.name}
            onChange={(e) => {
              setName(e.target.value)
              clearError("name")
            }}
          />
          <FieldError>{errors.name}</FieldError>
        </Field>

        <Field data-invalid={!!errors.tag}>
          <FieldLabel htmlFor="player-tag">Player tag (optional)</FieldLabel>
          <Input
            id="player-tag"
            value={tag}
            placeholder="#2PP0JCCL"
            maxLength={16}
            className="font-mono uppercase"
            aria-invalid={!!errors.tag}
            onChange={(e) => {
              setTag(e.target.value)
              clearError("tag")
            }}
          />
          {errors.tag ? (
            <FieldError>{errors.tag}</FieldError>
          ) : (
            <FieldDescription>
              Find it on the player profile in game. Keeps two members with the
              same name apart.
            </FieldDescription>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={!!errors.townHall}>
            <FieldLabel htmlFor="player-th">Town Hall</FieldLabel>
            <Select
              value={townHall}
              onValueChange={(value) => {
                setTownHall(value)
                clearError("townHall")
              }}
            >
              <SelectTrigger
                id="player-th"
                className="w-full"
                aria-invalid={!!errors.townHall}
              >
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {TOWN_HALLS.map((level) => (
                  <SelectItem key={level} value={String(level)}>
                    Town Hall {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{errors.townHall}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="player-role">Role</FieldLabel>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as PlayerRole)}
            >
              <SelectTrigger id="player-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAYER_ROLES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {ROLE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          {player ? "Save changes" : "Add player"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function PlayerDialog({
  player,
  open,
  onOpenChange,
}: {
  player?: PlayerDTO
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {player ? `Edit ${player.name}` : "Add a player"}
          </DialogTitle>
          <DialogDescription>
            {player
              ? "Update this clan member's details."
              : "Add a clan member you can pick for wars."}
          </DialogDescription>
        </DialogHeader>
        <PlayerForm player={player} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
