"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CWL_LEAGUES } from "@/lib/constants"

const NONE = "none"
const HIGHEST_FIRST = [...CWL_LEAGUES].reverse()

/** League picker; an empty string means "not set". */
export function LeagueSelect({
  id,
  value,
  onChange,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select
      value={value === "" ? NONE : value}
      onValueChange={(next) => onChange(next === NONE ? "" : next)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Not set</SelectItem>
        {HIGHEST_FIRST.map((league) => (
          <SelectItem key={league} value={league}>
            {league}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
