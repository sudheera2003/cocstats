"use client"

import { useState } from "react"
import { toast } from "sonner"

import {
  WarDetailsFields,
  type WarDetailsValues,
} from "@/components/wars/war-details-fields"
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useFormAction } from "@/hooks/use-form-action"
import { updateWar } from "@/lib/actions/wars"
import { fromDateTimeLocal, toDateTimeLocal } from "@/lib/format"
import type { WarDTO } from "@/lib/types"
import { updateWarSchema } from "@/lib/validation"

function EditWarForm({
  war,
  endWar,
  onDone,
}: {
  war: WarDTO
  endWar: boolean
  onDone: () => void
}) {
  const [details, setDetails] = useState<WarDetailsValues>({
    opponent: war.opponent,
    type: war.type,
    size: String(war.size),
    attacksPerMember: String(war.attacksPerMember),
    notes: war.notes,
  })
  const [startedAt, setStartedAt] = useState(() =>
    toDateTimeLocal(war.startedAt)
  )
  const [ended, setEnded] = useState(endWar || war.status === "ended")
  const [opponentStars, setOpponentStars] = useState(
    war.opponentStars === null ? "" : String(war.opponentStars)
  )
  const [opponentDestruction, setOpponentDestruction] = useState(
    war.opponentDestruction === null ? "" : String(war.opponentDestruction)
  )
  const { pending, errors, submit, clearError } = useFormAction()

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    submit(
      updateWarSchema,
      {
        warId: war.id,
        ...details,
        size: Number(details.size),
        attacksPerMember: Number(details.attacksPerMember),
        startedAt: fromDateTimeLocal(startedAt) ?? "",
        ended,
        opponentStars: opponentStars === "" ? null : Number(opponentStars),
        opponentDestruction:
          opponentDestruction === "" ? null : Number(opponentDestruction),
      },
      (data) => updateWar(data),
      () => {
        toast.success(endWar ? "War ended" : "War updated")
        onDone()
      }
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FieldGroup>
        <WarDetailsFields
          idPrefix="edit-war"
          values={details}
          onChange={(patch) => setDetails((d) => ({ ...d, ...patch }))}
          errors={errors}
          clearError={clearError}
          lockStructure={war.seasonId !== null}
        />

        <Field data-invalid={!!errors.startedAt}>
          <FieldLabel htmlFor="edit-war-start">Battle day start</FieldLabel>
          <Input
            id="edit-war-start"
            type="datetime-local"
            value={startedAt}
            className="w-full sm:w-64"
            aria-invalid={!!errors.startedAt}
            onChange={(e) => {
              setStartedAt(e.target.value)
              clearError("startedAt")
            }}
          />
          <FieldError>{errors.startedAt}</FieldError>
        </Field>

        <Field orientation="horizontal">
          <Switch
            id="edit-war-ended"
            checked={ended}
            onCheckedChange={setEnded}
          />
          <FieldLabel htmlFor="edit-war-ended">This war has ended</FieldLabel>
        </Field>

        {ended && (
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
            <Field data-invalid={!!errors.opponentStars}>
              <FieldLabel htmlFor="edit-war-opp-stars">Their stars</FieldLabel>
              <Input
                id="edit-war-opp-stars"
                autoFocus={endWar}
                type="number"
                inputMode="numeric"
                min={0}
                value={opponentStars}
                aria-invalid={!!errors.opponentStars}
                onChange={(e) => {
                  setOpponentStars(e.target.value)
                  clearError("opponentStars")
                }}
              />
              <FieldError>{errors.opponentStars}</FieldError>
            </Field>
            <Field data-invalid={!!errors.opponentDestruction}>
              <FieldLabel htmlFor="edit-war-opp-destruction">
                Their destruction
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="edit-war-opp-destruction"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={100}
                  value={opponentDestruction}
                  aria-invalid={!!errors.opponentDestruction}
                  onChange={(e) => {
                    setOpponentDestruction(e.target.value)
                    clearError("opponentDestruction")
                  }}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>%</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldError>{errors.opponentDestruction}</FieldError>
            </Field>
            <FieldDescription className="col-span-2">
              Fill in both to record a win, loss or tie. Leave them empty if you
              only care about your own attacks.
            </FieldDescription>
          </div>
        )}
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          {endWar ? "End war" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function EditWarDialog({
  war,
  open,
  onOpenChange,
  endWar = false,
}: {
  war: WarDTO
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Open straight into the "war has ended" flow. */
  endWar?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{endWar ? "End war" : "Edit war"}</DialogTitle>
          <DialogDescription>
            {endWar
              ? "Record how the war finished. Missed attacks are counted once a war has ended."
              : `Update the details of the war against ${war.opponent}.`}
          </DialogDescription>
        </DialogHeader>
        <EditWarForm
          war={war}
          endWar={endWar}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
