"use client"

import { useState } from "react"
import { toast } from "sonner"

import { TownHallBadge } from "@/components/badges"
import { Stars } from "@/components/stars"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useFormAction } from "@/hooks/use-form-action"
import { addAttack, updateAttack } from "@/lib/actions/wars"
import { ATTACK_WINDOW_MS, MAX_TOWN_HALL } from "@/lib/constants"
import {
  describeMatchup,
  fromDateTimeLocal,
  toDateTimeLocal,
} from "@/lib/format"
import type { AttackDTO, PlayerDTO, WarDTO } from "@/lib/types"
import {
  addAttackSchema,
  attackWindowIssue,
  updateAttackSchema,
} from "@/lib/validation"

const TOWN_HALLS = Array.from(
  { length: MAX_TOWN_HALL },
  (_, i) => MAX_TOWN_HALL - i
)

function defaultAttackTime(warStartedAt: string) {
  const now = Date.now()
  const start = Date.parse(warStartedAt)
  return new Date(now >= start && now <= start + ATTACK_WINDOW_MS ? now : start)
}

function AttackForm({
  war,
  players,
  playerId,
  targetPosition,
  attack,
  onDone,
}: {
  war: WarDTO
  players: PlayerDTO[]
  playerId?: string
  targetPosition?: number
  attack?: AttackDTO
  onDone: () => void
}) {
  const playersById = new Map(players.map((p) => [p.id, p]))
  const attacksLeft = (id: string) =>
    war.attacksPerMember - war.attacks.filter((a) => a.playerId === id).length
  const options = war.roster
    .map((entry) => ({ entry, player: playersById.get(entry.playerId) }))
    .filter(
      (o): o is { entry: typeof o.entry; player: PlayerDTO } =>
        !!o.player &&
        (attack
          ? o.entry.playerId === attack.playerId
          : attacksLeft(o.entry.playerId) > 0)
    )
    .sort(
      (a, b) =>
        b.entry.townHall - a.entry.townHall ||
        a.player.name.localeCompare(b.player.name)
    )

  const [pid, setPid] = useState(attack?.playerId ?? playerId ?? "")
  const [stars, setStars] = useState(attack ? String(attack.stars) : "")
  const [destruction, setDestruction] = useState(
    attack ? String(attack.destruction) : ""
  )
  const [minutes, setMinutes] = useState(
    attack?.durationSec != null
      ? String(Math.floor(attack.durationSec / 60))
      : ""
  )
  const [seconds, setSeconds] = useState(
    attack?.durationSec != null ? String(attack.durationSec % 60) : ""
  )
  const [attackedAt, setAttackedAt] = useState(() =>
    toDateTimeLocal(
      attack ? attack.attackedAt : defaultAttackTime(war.startedAt)
    )
  )
  const [target, setTarget] = useState(
    attack
      ? String(attack.targetPosition)
      : targetPosition !== undefined
        ? String(targetPosition)
        : ""
  )
  const [targetTh, setTargetTh] = useState(() => {
    if (attack) return attack.targetTownHall != null ? String(attack.targetTownHall) : ""
    const known = targetPosition !== undefined ? baseTownHall(targetPosition) : undefined
    return known != null ? String(known) : ""
  })
  const { pending, errors, submit, clearError } = useFormAction()

  // Every attack on the same enemy base must agree on its Town Hall.
  function baseTownHall(position: number) {
    return war.attacks.find(
      (a) =>
        a.id !== attack?.id &&
        a.targetPosition === position &&
        a.targetTownHall !== null
    )?.targetTownHall
  }

  const attackerTownHall = war.roster.find(
    (entry) => entry.playerId === pid
  )?.townHall
  const sharesBase = war.attacks.some(
    (a) => a.id !== attack?.id && a.targetPosition === Number(target)
  )
  const matchupHint =
    [
      attackerTownHall && targetTh !== ""
        ? describeMatchup(attackerTownHall, Number(targetTh))
        : null,
      attack && sharesBase
        ? `Other attacks on base #${target} will take this Town Hall too.`
        : null,
    ]
      .filter(Boolean)
      .join(". ") || null

  function changeTarget(value: string) {
    setTarget(value)
    clearError("targetPosition")
    const known = baseTownHall(Number(value))
    if (known) {
      setTargetTh(String(known))
      clearError("targetTownHall")
    }
  }

  function changeStars(value: string) {
    setStars(value)
    if (value === "3") setDestruction("100")
    clearError("stars")
    clearError("destruction")
  }

  function changeDestruction(value: string) {
    setDestruction(value)
    if (value === "100") setStars("3")
    clearError("destruction")
    clearError("stars")
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()

    const extraErrors: Record<string, string> = {}
    let durationSec: number | null = null
    if (minutes !== "" || seconds !== "") {
      const m = Number(minutes || 0)
      const s = Number(seconds || 0)
      if (
        !Number.isInteger(m) ||
        !Number.isInteger(s) ||
        m < 0 ||
        s < 0 ||
        s > 59
      ) {
        extraErrors.durationSec = "Use minutes and seconds, e.g. 2 : 41"
      } else {
        durationSec = m * 60 + s
      }
    }

    const attackedAtIso = fromDateTimeLocal(attackedAt)
    if (attackedAtIso) {
      const issue = attackWindowIssue(attackedAtIso, war.startedAt)
      if (issue) extraErrors.attackedAt = issue
    }
    if (Number(target) > war.size) {
      extraErrors.targetPosition = `This war has bases 1 to ${war.size}`
    }
    if (!pid) extraErrors.playerId = "Pick a player"
    const knownTh = baseTownHall(Number(target))
    if (!attack && knownTh && targetTh !== "" && Number(targetTh) !== knownTh) {
      extraErrors.targetTownHall = `Base #${target} is already TH${knownTh}. Edit the earlier attack on it to change the whole base.`
    }

    const fields = {
      warId: war.id,
      stars: stars === "" ? undefined : Number(stars),
      destruction: destruction === "" ? undefined : Number(destruction),
      durationSec,
      attackedAt: attackedAtIso ?? "",
      targetPosition: target === "" ? undefined : Number(target),
      targetTownHall: targetTh === "" ? undefined : Number(targetTh),
    }
    const onSuccess = () => {
      toast.success(attack ? "Attack updated" : "Attack logged")
      onDone()
    }

    if (attack) {
      submit(
        updateAttackSchema,
        { ...fields, attackId: attack.id },
        (data) => updateAttack(data),
        onSuccess,
        extraErrors
      )
    } else {
      submit(
        addAttackSchema,
        { ...fields, playerId: pid },
        (data) => addAttack(data),
        onSuccess,
        extraErrors
      )
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.playerId}>
          <FieldLabel htmlFor="attack-player">Player</FieldLabel>
          <Select
            value={pid}
            disabled={!!attack}
            onValueChange={(value) => {
              setPid(value)
              clearError("playerId")
            }}
          >
            <SelectTrigger
              id="attack-player"
              className="w-full"
              aria-invalid={!!errors.playerId}
            >
              <SelectValue placeholder="Who attacked?" />
            </SelectTrigger>
            <SelectContent>
              {options.map(({ entry, player }) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name} · TH{entry.townHall}
                  {!attack && ` · ${attacksLeft(player.id)} left`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {options.length === 0 && !attack && (
            <FieldDescription>
              Everyone on the roster has used all their attacks.
            </FieldDescription>
          )}
          <FieldError>{errors.playerId}</FieldError>
        </Field>

        <Field data-invalid={!!errors.stars}>
          <FieldLabel>Stars</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={stars}
            onValueChange={(value) => value && changeStars(value)}
            className="w-full"
            aria-label="Stars earned"
          >
            {[0, 1, 2, 3].map((n) => (
              <ToggleGroupItem
                key={n}
                value={String(n)}
                aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                className="h-9 flex-1"
              >
                <Stars value={n} />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldError>{errors.stars}</FieldError>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={!!errors.destruction}>
            <FieldLabel htmlFor="attack-destruction">Destruction</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="attack-destruction"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={destruction}
                aria-invalid={!!errors.destruction}
                onChange={(e) => changeDestruction(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>%</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldError>{errors.destruction}</FieldError>
          </Field>

          <Field data-invalid={!!errors.durationSec}>
            <FieldLabel htmlFor="attack-minutes">Battle time</FieldLabel>
            <div className="flex items-center gap-1.5">
              <Input
                id="attack-minutes"
                type="number"
                inputMode="numeric"
                min={0}
                max={3}
                placeholder="m"
                value={minutes}
                aria-label="Minutes"
                aria-invalid={!!errors.durationSec}
                onChange={(e) => {
                  setMinutes(e.target.value)
                  clearError("durationSec")
                }}
              />
              <span className="text-muted-foreground">:</span>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                placeholder="ss"
                value={seconds}
                aria-label="Seconds"
                aria-invalid={!!errors.durationSec}
                onChange={(e) => {
                  setSeconds(e.target.value)
                  clearError("durationSec")
                }}
              />
            </div>
            {errors.durationSec ? (
              <FieldError>{errors.durationSec}</FieldError>
            ) : (
              <FieldDescription>Optional, max 3:00</FieldDescription>
            )}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={!!errors.targetPosition}>
            <FieldLabel htmlFor="attack-target">Enemy base #</FieldLabel>
            <Input
              id="attack-target"
              type="number"
              inputMode="numeric"
              min={1}
              max={war.size}
              placeholder={`1–${war.size}`}
              value={target}
              aria-invalid={!!errors.targetPosition}
              onChange={(e) => changeTarget(e.target.value)}
            />
            <FieldError>{errors.targetPosition}</FieldError>
          </Field>

          <Field data-invalid={!!errors.targetTownHall}>
            <FieldLabel htmlFor="attack-target-th">Enemy Town Hall</FieldLabel>
            <Select
              value={targetTh}
              onValueChange={(value) => {
                setTargetTh(value)
                clearError("targetTownHall")
              }}
            >
              <SelectTrigger
                id="attack-target-th"
                className="w-full"
                aria-invalid={!!errors.targetTownHall}
              >
                <SelectValue placeholder="Pick level" />
              </SelectTrigger>
              <SelectContent>
                {TOWN_HALLS.map((level) => (
                  <SelectItem key={level} value={String(level)}>
                    Town Hall {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        {errors.targetTownHall ? (
          <FieldError>{errors.targetTownHall}</FieldError>
        ) : (
          matchupHint && (
            <FieldDescription className="-mt-2">{matchupHint}</FieldDescription>
          )
        )}

        <Field data-invalid={!!errors.attackedAt}>
          <FieldLabel htmlFor="attack-time">When did it happen?</FieldLabel>
          <Input
            id="attack-time"
            type="datetime-local"
            value={attackedAt}
            aria-invalid={!!errors.attackedAt}
            onChange={(e) => {
              setAttackedAt(e.target.value)
              clearError("attackedAt")
            }}
          />
          <FieldError>{errors.attackedAt}</FieldError>
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          {attack ? "Save changes" : "Log attack"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AttackDialog({
  war,
  players,
  open,
  onOpenChange,
  playerId,
  targetPosition,
  attack,
}: {
  war: WarDTO
  players: PlayerDTO[]
  open: boolean
  onOpenChange: (open: boolean) => void
  playerId?: string
  targetPosition?: number
  attack?: AttackDTO
}) {
  const player = players.find((p) => p.id === (attack?.playerId ?? playerId))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {attack ? "Edit attack" : "Log an attack"}
            {player && (
              <span className="ml-2 inline-flex align-middle">
                <TownHallBadge
                  level={
                    war.roster.find((r) => r.playerId === player.id)
                      ?.townHall ?? player.townHall
                  }
                />
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {attack
              ? `Attack ${attack.order} by ${player?.name ?? "this player"} against ${war.opponent}.`
              : targetPosition !== undefined
                ? `Record a hit on base #${targetPosition} against ${war.opponent}.`
                : `Record a hit against ${war.opponent}.`}
          </DialogDescription>
        </DialogHeader>
        <AttackForm
          war={war}
          players={players}
          playerId={playerId}
          targetPosition={targetPosition}
          attack={attack}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
