"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { RosterPicker } from "@/components/wars/roster-picker"
import {
  DEFAULT_WAR_DETAILS,
  WarDetailsFields,
  type WarDetailsValues,
} from "@/components/wars/war-details-fields"
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
import { useFormAction } from "@/hooks/use-form-action"
import { createWar } from "@/lib/actions/wars"
import { fromDateTimeLocal } from "@/lib/format"
import type { PlayerDTO } from "@/lib/types"
import { createWarSchema } from "@/lib/validation"

export function NewWarForm({ players }: { players: PlayerDTO[] }) {
  const router = useRouter()
  const [details, setDetails] = useState<WarDetailsValues>(DEFAULT_WAR_DETAILS)
  const [startedAt, setStartedAt] = useState("")
  const [playerIds, setPlayerIds] = useState<string[]>([])
  const { pending, errors, submit, clearError } = useFormAction()

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    submit(
      createWarSchema,
      {
        ...details,
        size: Number(details.size),
        attacksPerMember: Number(details.attacksPerMember),
        startedAt: fromDateTimeLocal(startedAt),
        playerIds,
      },
      (data) => createWar(data),
      ({ id }) => {
        toast.success("War created. Start logging attacks!")
        router.push(`/wars/${id}`)
      }
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>War details</CardTitle>
          <CardDescription>Who you&apos;re fighting and how.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <WarDetailsFields
              idPrefix="new-war"
              values={details}
              onChange={(patch) => setDetails((d) => ({ ...d, ...patch }))}
              errors={errors}
              clearError={clearError}
              autoFocus
            />
            <Field data-invalid={!!errors.startedAt}>
              <FieldLabel htmlFor="new-war-start">Battle day start</FieldLabel>
              <Input
                id="new-war-start"
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
                <FieldDescription>
                  Leave empty to start right now. Attack times are measured from
                  here.
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
          <CardDescription>
            Pick the players taking part. You can change this later.
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
            max={Number(details.size)}
            error={errors.playerIds}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/wars">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          Start war
        </Button>
      </div>
    </form>
  )
}
