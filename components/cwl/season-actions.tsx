"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { LeagueSelect } from "@/components/cwl/league-select"
import { StartDayButton } from "@/components/cwl/start-day-dialog"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useFormAction } from "@/hooks/use-form-action"
import {
  deleteSeason,
  updateSeason,
  updateSeasonRoster,
} from "@/lib/actions/seasons"
import { CWL_GROUP_SIZE, MAX_CWL_ROSTER } from "@/lib/constants"
import type { PlayerDTO, SeasonDTO } from "@/lib/types"
import { seasonRosterSchema, updateSeasonSchema } from "@/lib/validation"

function EditSeasonForm({
  season,
  onDone,
}: {
  season: SeasonDTO
  onDone: () => void
}) {
  const [name, setName] = useState(season.name)
  const [league, setLeague] = useState(season.league ?? "")
  const [finalRank, setFinalRank] = useState(
    season.finalRank === null ? "" : String(season.finalRank)
  )
  const [notes, setNotes] = useState(season.notes)
  const { pending, errors, submit, clearError } = useFormAction()

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    submit(
      updateSeasonSchema,
      {
        seasonId: season.id,
        name,
        league,
        notes,
        finalRank: finalRank === "" ? null : Number(finalRank),
      },
      (data) => updateSeason(data),
      () => {
        toast.success("Season updated")
        onDone()
      }
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="edit-season-name">Season name</FieldLabel>
          <Input
            id="edit-season-name"
            value={name}
            maxLength={40}
            aria-invalid={!!errors.name}
            onChange={(e) => {
              setName(e.target.value)
              clearError("name")
            }}
          />
          <FieldError>{errors.name}</FieldError>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="edit-season-league">League</FieldLabel>
            <LeagueSelect
              id="edit-season-league"
              value={league}
              onChange={setLeague}
            />
          </Field>
          <Field data-invalid={!!errors.finalRank}>
            <FieldLabel htmlFor="edit-season-rank">Final placement</FieldLabel>
            <Input
              id="edit-season-rank"
              type="number"
              inputMode="numeric"
              min={1}
              max={CWL_GROUP_SIZE}
              placeholder={`1–${CWL_GROUP_SIZE}`}
              value={finalRank}
              aria-invalid={!!errors.finalRank}
              onChange={(e) => {
                setFinalRank(e.target.value)
                clearError("finalRank")
              }}
            />
            {errors.finalRank ? (
              <FieldError>{errors.finalRank}</FieldError>
            ) : (
              <FieldDescription>
                Where you finished in the group.
              </FieldDescription>
            )}
          </Field>
        </div>
        <Field data-invalid={!!errors.notes}>
          <FieldLabel htmlFor="edit-season-notes">Notes (optional)</FieldLabel>
          <Textarea
            id="edit-season-notes"
            value={notes}
            maxLength={500}
            rows={2}
            aria-invalid={!!errors.notes}
            onChange={(e) => {
              setNotes(e.target.value)
              clearError("notes")
            }}
          />
          <FieldError>{errors.notes}</FieldError>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  )
}

function SeasonRosterForm({
  season,
  players,
  lockedIds,
  onDone,
}: {
  season: SeasonDTO
  players: PlayerDTO[]
  lockedIds: ReadonlySet<string>
  onDone: () => void
}) {
  const [playerIds, setPlayerIds] = useState(season.rosterIds)
  const { pending, errors, submit, clearError } = useFormAction()

  const inRoster = new Set(season.rosterIds)
  const pickable = players.filter((p) => p.active || inRoster.has(p.id))

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    submit(
      seasonRosterSchema,
      { seasonId: season.id, playerIds },
      (data) => updateSeasonRoster(data),
      () => {
        toast.success("Season roster updated")
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
        max={MAX_CWL_ROSTER}
        locked={lockedIds}
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

export function SeasonActions({
  season,
  players,
  lockedIds,
  nextDay,
  defaultLineup,
  rosterPlayers,
  warCount,
}: {
  season: SeasonDTO
  /** Everyone, for editing the season roster. */
  players: PlayerDTO[]
  /** Players who've been in a lineup and can't be removed from the season. */
  lockedIds: string[]
  nextDay: number | null
  defaultLineup: string[]
  /** The season roster, for picking a lineup. */
  rosterPlayers: PlayerDTO[]
  warCount: number
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      {nextDay !== null && (
        <StartDayButton
          primary
          season={season}
          players={rosterPlayers}
          day={nextDay}
          defaultLineup={defaultLineup}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More actions">
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon /> Edit season
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setRosterOpen(true)}>
            <UsersIcon /> Edit season roster
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2Icon /> Delete season
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit season</DialogTitle>
            <DialogDescription>
              Name, league and where you finished.
            </DialogDescription>
          </DialogHeader>
          <EditSeasonForm season={season} onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={rosterOpen} onOpenChange={setRosterOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Season roster</DialogTitle>
            <DialogDescription>
              Everyone who can be put in a daily lineup. Players who have
              already fought a day are locked in.
            </DialogDescription>
          </DialogHeader>
          <SeasonRosterForm
            season={season}
            players={players}
            lockedIds={new Set(lockedIds)}
            onDone={() => setRosterOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${season.name}?`}
        description={`This permanently removes the season and its ${warCount} war${warCount === 1 ? "" : "s"} with every logged attack. Player stats will be recalculated.`}
        successMessage="Season deleted"
        onConfirm={() => deleteSeason(season.id)}
        onSuccess={() => router.push("/cwl")}
      />
    </>
  )
}
