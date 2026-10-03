"use client"

import { useMemo, useState } from "react"
import { LockIcon, SearchIcon } from "lucide-react"

import { RoleBadge, TownHallBadge } from "@/components/badges"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldError } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PlayerDTO } from "@/lib/types"
import { cn } from "@/lib/utils"

export function RosterPicker({
  players,
  selected,
  onChange,
  max,
  locked,
  error,
}: {
  players: PlayerDTO[]
  selected: string[]
  onChange: (ids: string[]) => void
  max: number
  /** Players that can't be removed because they already have attacks logged. */
  locked?: ReadonlySet<string>
  error?: string
}) {
  const [query, setQuery] = useState("")
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return players
      .filter(
        (p) =>
          needle === "" ||
          p.name.toLowerCase().includes(needle) ||
          (p.tag ?? "").toLowerCase().includes(needle)
      )
      .sort((a, b) => b.townHall - a.townHall || a.name.localeCompare(b.name))
  }, [players, query])

  const full = selected.length >= max

  function toggle(id: string, checked: boolean) {
    if (checked) {
      if (!full) onChange([...selected, id])
    } else if (!locked?.has(id)) {
      onChange(selected.filter((s) => s !== id))
    }
  }

  function selectAllVisible() {
    const next = new Set(selected)
    for (const player of visible) {
      if (next.size >= max) break
      next.add(player.id)
    }
    onChange([...next])
  }

  function clear() {
    onChange(selected.filter((id) => locked?.has(id)))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <InputGroup className="max-w-xs">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search players"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search players"
          />
        </InputGroup>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs text-muted-foreground tabular-nums",
              selected.length > max && "text-destructive"
            )}
          >
            {selected.length} / {max} selected
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAllVisible}
            disabled={visible.length === 0 || full}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={selected.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <ScrollArea
        className={cn(
          "h-72 rounded-lg border",
          error && "border-destructive/60"
        )}
      >
        {visible.length === 0 ? (
          <p className="p-6 text-center text-xs text-muted-foreground">
            {players.length === 0
              ? "No active players. Add some on the Players page first."
              : `No players match “${query}”.`}
          </p>
        ) : (
          <ul className="divide-y">
            {visible.map((player) => {
              const checked = selectedSet.has(player.id)
              const isLocked = checked && locked?.has(player.id)
              const disabled = isLocked || (!checked && full)
              return (
                <li key={player.id}>
                  <label
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-xs",
                      disabled
                        ? "opacity-60"
                        : "cursor-pointer hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(value) =>
                        toggle(player.id, value === true)
                      }
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {player.name}
                      {player.tag && (
                        <span className="ml-2 font-mono text-[0.7rem] font-normal text-muted-foreground">
                          {player.tag}
                        </span>
                      )}
                    </span>
                    {isLocked && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <LockIcon className="size-3" /> has attacks
                      </span>
                    )}
                    <RoleBadge role={player.role} />
                    <TownHallBadge level={player.townHall} />
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>
      <FieldError>{error}</FieldError>
    </div>
  )
}
