"use client"

import {
  Field,
  FieldDescription,
  FieldError,
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
import { Textarea } from "@/components/ui/textarea"
import type { FieldErrors } from "@/hooks/use-form-action"
import { WAR_TYPE_META, WAR_TYPES, type WarType } from "@/lib/constants"

// CWL wars aren't created one by one: they're days of a CWL season.
const SELECTABLE_TYPES = WAR_TYPES.filter((type) => type !== "cwl")

export interface WarDetailsValues {
  opponent: string
  type: WarType
  size: string
  attacksPerMember: string
  notes: string
}

export const DEFAULT_WAR_DETAILS: WarDetailsValues = {
  opponent: "",
  type: "regular",
  size: "15",
  attacksPerMember: String(WAR_TYPE_META.regular.attacksPerMember),
  notes: "",
}

export function WarDetailsFields({
  idPrefix,
  values,
  onChange,
  errors,
  clearError,
  autoFocus,
  lockStructure,
}: {
  idPrefix: string
  values: WarDetailsValues
  onChange: (patch: Partial<WarDetailsValues>) => void
  errors: FieldErrors
  clearError: (field: string) => void
  autoFocus?: boolean
  /** CWL days get their type, size and attacks from the season. */
  lockStructure?: boolean
}) {
  const meta = WAR_TYPE_META[values.type]

  function changeType(type: WarType) {
    const next = WAR_TYPE_META[type]
    onChange({
      type,
      size: next.sizes.includes(Number(values.size))
        ? values.size
        : String(next.sizes[0]),
      attacksPerMember: String(next.attacksPerMember),
    })
    clearError("type")
    clearError("size")
  }

  return (
    <>
      <Field data-invalid={!!errors.opponent}>
        <FieldLabel htmlFor={`${idPrefix}-opponent`}>Opponent clan</FieldLabel>
        <Input
          id={`${idPrefix}-opponent`}
          value={values.opponent}
          maxLength={40}
          autoFocus={autoFocus}
          placeholder="Clan name"
          aria-invalid={!!errors.opponent}
          onChange={(e) => {
            onChange({ opponent: e.target.value })
            clearError("opponent")
          }}
        />
        <FieldError>{errors.opponent}</FieldError>
      </Field>

      {!lockStructure && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-type`}>War type</FieldLabel>
            <Select
              value={values.type}
              onValueChange={(value) => changeType(value as WarType)}
            >
              <SelectTrigger id={`${idPrefix}-type`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELECTABLE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {WAR_TYPE_META[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field data-invalid={!!errors.size}>
            <FieldLabel htmlFor={`${idPrefix}-size`}>War size</FieldLabel>
            <Select
              value={values.size}
              onValueChange={(size) => {
                onChange({ size })
                clearError("size")
              }}
            >
              <SelectTrigger
                id={`${idPrefix}-size`}
                className="w-full"
                aria-invalid={!!errors.size}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meta.sizes.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} vs {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{errors.size}</FieldError>
          </Field>

          <Field data-invalid={!!errors.attacksPerMember}>
            <FieldLabel htmlFor={`${idPrefix}-attacks`}>
              Attacks each
            </FieldLabel>
            <Select
              value={values.attacksPerMember}
              onValueChange={(attacksPerMember) => {
                onChange({ attacksPerMember })
                clearError("attacksPerMember")
              }}
            >
              <SelectTrigger id={`${idPrefix}-attacks`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 attack</SelectItem>
                <SelectItem value="2">2 attacks</SelectItem>
              </SelectContent>
            </Select>
            <FieldError>{errors.attacksPerMember}</FieldError>
          </Field>
        </div>
      )}

      <Field data-invalid={!!errors.notes}>
        <FieldLabel htmlFor={`${idPrefix}-notes`}>Notes (optional)</FieldLabel>
        <Textarea
          id={`${idPrefix}-notes`}
          value={values.notes}
          maxLength={500}
          rows={2}
          placeholder="Strategy, lineup changes, anything worth remembering"
          aria-invalid={!!errors.notes}
          onChange={(e) => {
            onChange({ notes: e.target.value })
            clearError("notes")
          }}
        />
        {errors.notes ? (
          <FieldError>{errors.notes}</FieldError>
        ) : (
          <FieldDescription>{values.notes.length}/500</FieldDescription>
        )}
      </Field>
    </>
  )
}
