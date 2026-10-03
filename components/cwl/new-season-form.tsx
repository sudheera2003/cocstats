"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { LeagueSelect } from "@/components/cwl/league-select"
import { RosterPicker } from "@/components/wars/roster-picker"
import { useFormAction } from "@/hooks/use-form-action"
import { createSeason } from "@/lib/actions/seasons"
import { CWL_SIZES, MAX_CWL_ROSTER } from "@/lib/constants"
import type { PlayerDTO } from "@/lib/types"
import { createSeasonSchema } from "@/lib/validation"

export function NewSeasonForm({
  players,
  defaultName,
}: {
  players: PlayerDTO[]
  defaultName: string
}) {
  const router = useRouter()
  const [name, setName] = useState(defaultName)
  const [league, setLeague] = useState("")
  const [size, setSize] = useState(String(CWL_SIZES[0]))
  // Everyone is registered by default, like in the game.
  const [playerIds, setPlayerIds] = useState(
    players.slice(0, MAX_CWL_ROSTER).map((p) => p.id)
  )
  const { pending, errors, submit, clearError } = useFormAction()

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    submit(
      createSeasonSchema,
      { name, league, notes: "", size: Number(size), playerIds },
      (data) => createSeason(data),
      ({ id }) => {
        toast.success("Season created. Start day 1 when your first war begins.")
        router.push(`/cwl/${id}`)
      }
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Season details</CardTitle>
          <CardDescription>
            A CWL season is seven daily wars, one against each of the other
            seven clans in your group.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="season-name">Season name</FieldLabel>
              <Input
                id="season-name"
                value={name}
                maxLength={40}
                autoFocus
                aria-invalid={!!errors.name}
                onChange={(e) => {
                  setName(e.target.value)
                  clearError("name")
                }}
              />
              <FieldError>{errors.name}</FieldError>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field data-invalid={!!errors.league}>
                <FieldLabel htmlFor="season-league">
                  League (optional)
                </FieldLabel>
                <LeagueSelect
                  id="season-league"
                  value={league}
                  onChange={(value) => {
                    setLeague(value)
                    clearError("league")
                  }}
                />
                <FieldError>{errors.league}</FieldError>
              </Field>

              <Field data-invalid={!!errors.size}>
                <FieldLabel>War size</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={size}
                  onValueChange={(value) => value && setSize(value)}
                  className="w-full"
                  aria-label="War size"
                >
                  {CWL_SIZES.map((option) => (
                    <ToggleGroupItem
                      key={option}
                      value={String(option)}
                      className="h-7 flex-1"
                    >
                      {option} vs {option}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldError>{errors.size}</FieldError>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Season roster</CardTitle>
          <CardDescription>
            Everyone who can fight this season. Each day you&apos;ll pick {size}{" "}
            of them for the lineup, and you can change the roster later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RosterPicker
            players={players}
            selected={playerIds}
            onChange={(ids) => {
              setPlayerIds(ids)
              clearError("playerIds")
            }}
            max={MAX_CWL_ROSTER}
            error={errors.playerIds}
          />
          <FieldDescription className="mt-2">
            {playerIds.length < Number(size)
              ? `You need at least ${size} players to fill a ${size}v${size} lineup.`
              : `${playerIds.length - Number(size)} spare for rotating in and out.`}
          </FieldDescription>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/cwl">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          Create season
        </Button>
      </div>
    </form>
  )
}
