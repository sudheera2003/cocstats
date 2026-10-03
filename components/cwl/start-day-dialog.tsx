"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { PlayIcon } from "lucide-react"
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
import { Spinner } from "@/components/ui/spinner"
import { RosterPicker } from "@/components/wars/roster-picker"
import { useFormAction } from "@/hooks/use-form-action"
import { createCwlDay } from "@/lib/actions/seasons"
import { fromDateTimeLocal } from "@/lib/format"
import type { PlayerDTO, SeasonDTO } from "@/lib/types"
import { createCwlDaySchema } from "@/lib/validation"

function StartDayForm({
  season,
  players,
  day,
  defaultLineup,
  onDone,
}: {
  season: SeasonDTO
  /** The season roster: the only players who can be put in a lineup. */
  players: PlayerDTO[]
  day: number
  defaultLineup: string[]
  onDone: () => void
}) {
  const router = useRouter()
  const [opponent, setOpponent] = useState("")
  const [startedAt, setStartedAt] = useState("")
  const [playerIds, setPlayerIds] = useState(defaultLineup)
  const { pending, errors, submit, clearError } = useFormAction()

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    submit(
      createCwlDaySchema,
      {
        seasonId: season.id,
        day,
        opponent,
        startedAt: fromDateTimeLocal(startedAt),
        playerIds,
      },
      (data) => createCwlDay(data),
      ({ id }) => {
        toast.success(`Day ${day} started`)
        onDone()
        router.push(`/wars/${id}`)
      }
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.opponent}>
          <FieldLabel htmlFor="cwl-opponent">Opponent clan</FieldLabel>
          <Input
            id="cwl-opponent"
            value={opponent}
            maxLength={40}
            autoFocus
            placeholder="Clan name"
            aria-invalid={!!errors.opponent}
            onChange={(e) => {
              setOpponent(e.target.value)
              clearError("opponent")
            }}
          />
          {errors.opponent ? (
            <FieldError>{errors.opponent}</FieldError>
          ) : (
            <FieldDescription>
              You face a different clan every day.
            </FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!errors.startedAt}>
          <FieldLabel htmlFor="cwl-start">Battle day start</FieldLabel>
          <Input
            id="cwl-start"
            type="datetime-local"
            value={startedAt}
            className="w-full sm:w-64"
            aria-invalid={!!errors.startedAt}
            onChange={(e) => {
              setStartedAt(e.target.value)
              clearError("startedAt")
            }}
          />
          {errors.startedAt ? (
            <FieldError>{errors.startedAt}</FieldError>
          ) : (
            <FieldDescription>Leave empty to start right now.</FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel>
            Lineup: pick {season.size} from the season roster
          </FieldLabel>
          <RosterPicker
            players={players}
            selected={playerIds}
            onChange={(ids) => {
              setPlayerIds(ids)
              clearError("playerIds")
            }}
            max={season.size}
            error={errors.playerIds}
          />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          Start day {day}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function StartDayButton({
  season,
  players,
  day,
  defaultLineup,
  primary = false,
}: {
  season: SeasonDTO
  players: PlayerDTO[]
  day: number
  defaultLineup: string[]
  primary?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant={primary ? "default" : "outline"}
        size={primary ? "default" : "sm"}
        onClick={() => setOpen(true)}
      >
        <PlayIcon /> Start day {day}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start day {day}</DialogTitle>
            <DialogDescription>
              Who you face today and which {season.size} players fight. The
              lineup starts as yesterday&apos;s, so just swap who&apos;s
              changing.
            </DialogDescription>
          </DialogHeader>
          <StartDayForm
            season={season}
            players={players}
            day={day}
            defaultLineup={defaultLineup}
            onDone={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
