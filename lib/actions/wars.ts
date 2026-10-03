"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"

import { fail, ok } from "@/lib/actions/result"
import { getSeason, getWar } from "@/lib/data"
import { playersCollection, warsCollection, type AttackDoc } from "@/lib/db"
import { renumberAttacks } from "@/lib/stats"
import type { ActionResult, AttackDTO } from "@/lib/types"
import {
  addAttackSchema,
  attackWindowIssue,
  createWarSchema,
  fieldErrorsFrom,
  isObjectIdString,
  rosterSchema,
  updateAttackSchema,
  updateWarSchema,
  type CreateWarInput,
  type UpdateWarInput,
} from "@/lib/validation"

const NOT_FOUND = "War not found"

function refresh() {
  revalidatePath("/", "layout")
}

function attackToDoc(attack: AttackDTO): AttackDoc {
  return {
    ...attack,
    playerId: new ObjectId(attack.playerId),
    attackedAt: new Date(attack.attackedAt),
  }
}

function floorToMinute(date: Date) {
  return new Date(Math.floor(date.getTime() / 60_000) * 60_000)
}

function maxAttacksByOnePlayer(attacks: AttackDTO[]) {
  const counts = new Map<string, number>()
  for (const attack of attacks) {
    counts.set(attack.playerId, (counts.get(attack.playerId) ?? 0) + 1)
  }
  return Math.max(0, ...counts.values())
}

/** Every attack on the same enemy base must agree on that base's Town Hall. */
function townHallConflict(
  attacks: AttackDTO[],
  position: number,
  townHall: number
) {
  const other = attacks.find(
    (a) =>
      a.targetPosition === position &&
      a.targetTownHall !== null &&
      a.targetTownHall !== townHall
  )
  return other
    ? `Base #${position} is already recorded as TH${other.targetTownHall}. If that's wrong, edit the earlier attack on it to change the whole base.`
    : null
}

async function saveAttacks(warId: string, attacks: AttackDTO[]) {
  const wars = await warsCollection()
  await wars.updateOne(
    { _id: new ObjectId(warId) },
    { $set: { attacks: renumberAttacks(attacks).map(attackToDoc) } }
  )
}

export async function createWar(
  input: CreateWarInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createWarSchema.safeParse(input)
  if (!parsed.success) {
    return fail("Check the highlighted fields", fieldErrorsFrom(parsed.error))
  }
  const { playerIds, startedAt, ...details } = parsed.data

  const players = await playersCollection()
  const found = await players
    .find({ _id: { $in: playerIds.map((id) => new ObjectId(id)) } })
    .toArray()
  if (found.length !== playerIds.length) {
    return fail("Some of the selected players no longer exist", {
      playerIds: "Refresh the page and pick the roster again",
    })
  }
  const townHalls = new Map(found.map((p) => [p._id.toHexString(), p.townHall]))

  const wars = await warsCollection()
  const _id = new ObjectId()
  await wars.insertOne({
    _id,
    ...details,
    startedAt: startedAt ? new Date(startedAt) : floorToMinute(new Date()),
    status: "ongoing",
    roster: playerIds.map((id) => ({
      playerId: new ObjectId(id),
      townHall: townHalls.get(id)!,
    })),
    attacks: [],
    opponentStars: null,
    opponentDestruction: null,
    createdAt: new Date(),
    seasonId: null,
    day: null,
  })

  refresh()
  return ok({ id: _id.toHexString() })
}

export async function updateWar(input: UpdateWarInput): Promise<ActionResult> {
  const parsed = updateWarSchema.safeParse(input)
  if (!parsed.success) {
    return fail("Check the highlighted fields", fieldErrorsFrom(parsed.error))
  }
  const {
    warId,
    startedAt,
    ended,
    opponentStars,
    opponentDestruction,
    ...rest
  } = parsed.data

  const war = await getWar(warId)
  if (!war) return fail(NOT_FOUND)

  if (war.seasonId) {
    if (
      rest.type !== war.type ||
      rest.size !== war.size ||
      rest.attacksPerMember !== war.attacksPerMember
    ) {
      return fail("A CWL day's type and size are set by its season")
    }
    const sameSeason = await (
      await warsCollection()
    ).findOne(
      {
        _id: { $ne: new ObjectId(warId) },
        seasonId: new ObjectId(war.seasonId),
        opponent: rest.opponent,
      },
      { collation: { locale: "en", strength: 2 } }
    )
    if (sameSeason) {
      return fail("You already fought that clan this season", {
        opponent: `Already fought on day ${sameSeason.day}`,
      })
    }
  } else if (rest.type === "cwl") {
    return fail("Create CWL wars from a CWL season", {
      type: "Use the CWL page to add a day",
    })
  }

  if (rest.size < war.roster.length) {
    return fail("Size is smaller than the roster", {
      size: `The roster already has ${war.roster.length} players`,
    })
  }
  const highestBase = Math.max(0, ...war.attacks.map((a) => a.targetPosition))
  if (rest.size < highestBase) {
    return fail("Size is smaller than a logged target", {
      size: `An attack already targets base #${highestBase}`,
    })
  }
  const busiestPlayer = maxAttacksByOnePlayer(war.attacks)
  if (rest.attacksPerMember < busiestPlayer) {
    return fail("Too few attacks per member", {
      attacksPerMember: `A player already has ${busiestPlayer} attacks logged`,
    })
  }

  const wars = await warsCollection()
  await wars.updateOne(
    { _id: new ObjectId(warId) },
    {
      $set: {
        ...rest,
        startedAt: new Date(startedAt),
        status: ended ? "ended" : "ongoing",
        opponentStars: ended ? opponentStars : null,
        opponentDestruction: ended ? opponentDestruction : null,
      },
    }
  )

  refresh()
  return ok()
}

export async function updateRoster(input: {
  warId: string
  playerIds: string[]
}): Promise<ActionResult> {
  const parsed = rosterSchema.safeParse(input)
  if (!parsed.success) {
    return fail("Check the highlighted fields", fieldErrorsFrom(parsed.error))
  }
  const { warId, playerIds } = parsed.data

  const war = await getWar(warId)
  if (!war) return fail(NOT_FOUND)
  if (playerIds.length > war.size) {
    return fail(
      `A ${war.size}v${war.size} war fits at most ${war.size} players`,
      {
        playerIds: `Select at most ${war.size} players`,
      }
    )
  }

  if (war.seasonId) {
    const season = await getSeason(war.seasonId)
    const pool = new Set(season?.rosterIds)
    if (playerIds.some((id) => !pool.has(id))) {
      return fail("Lineups come from the season roster", {
        playerIds:
          "Add the player to the season roster first, then pick them here",
      })
    }
  }

  const selected = new Set(playerIds)
  const blocked = war.roster.filter(
    (entry) =>
      !selected.has(entry.playerId) &&
      war.attacks.some((a) => a.playerId === entry.playerId)
  )
  if (blocked.length > 0) {
    return fail("Players with logged attacks can't be removed", {
      playerIds: "Delete their attacks first",
    })
  }

  const existing = new Map(war.roster.map((e) => [e.playerId, e.townHall]))
  const newIds = playerIds.filter((id) => !existing.has(id))
  const players = await playersCollection()
  const found = await players
    .find({ _id: { $in: newIds.map((id) => new ObjectId(id)) } })
    .toArray()
  if (found.length !== newIds.length) {
    return fail("Some of the selected players no longer exist")
  }
  const townHalls = new Map(found.map((p) => [p._id.toHexString(), p.townHall]))

  const wars = await warsCollection()
  await wars.updateOne(
    { _id: new ObjectId(warId) },
    {
      $set: {
        roster: playerIds.map((id) => ({
          playerId: new ObjectId(id),
          townHall: existing.get(id) ?? townHalls.get(id)!,
        })),
      },
    }
  )

  refresh()
  return ok()
}

export async function deleteWar(warId: string): Promise<ActionResult> {
  if (!isObjectIdString(warId)) return fail(NOT_FOUND)
  const wars = await warsCollection()
  const result = await wars.deleteOne({ _id: new ObjectId(warId) })
  if (result.deletedCount === 0) return fail(NOT_FOUND)

  // No revalidation on purpose: any revalidate re-renders the current route,
  // which is this war's own page, so it would flash a 404 before the client
  // navigates away. Dynamic pages aren't cached client-side, so the list is fresh.
  return ok()
}

export async function addAttack(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = addAttackSchema.safeParse(input)
  if (!parsed.success) {
    return fail("Check the highlighted fields", fieldErrorsFrom(parsed.error))
  }
  const { warId, playerId, ...fields } = parsed.data

  const war = await getWar(warId)
  if (!war) return fail(NOT_FOUND)
  if (!war.roster.some((entry) => entry.playerId === playerId)) {
    return fail("That player isn't on this war's roster", {
      playerId: "Not on the roster",
    })
  }
  const used = war.attacks.filter((a) => a.playerId === playerId).length
  if (used >= war.attacksPerMember) {
    return fail("All attacks used", {
      playerId: `This player already used all ${war.attacksPerMember} attack${war.attacksPerMember === 1 ? "" : "s"}`,
    })
  }
  if (fields.targetPosition > war.size) {
    return fail("Base number out of range", {
      targetPosition: `This war has bases 1 to ${war.size}`,
    })
  }
  const windowIssue = attackWindowIssue(fields.attackedAt, war.startedAt)
  if (windowIssue) return fail(windowIssue, { attackedAt: windowIssue })
  const conflict = townHallConflict(
    war.attacks,
    fields.targetPosition,
    fields.targetTownHall
  )
  if (conflict) return fail(conflict, { targetTownHall: conflict })

  const id = crypto.randomUUID()
  await saveAttacks(warId, [
    ...war.attacks,
    { ...fields, id, playerId, order: used + 1 },
  ])

  refresh()
  return ok({ id })
}

export async function updateAttack(input: unknown): Promise<ActionResult> {
  const parsed = updateAttackSchema.safeParse(input)
  if (!parsed.success) {
    return fail("Check the highlighted fields", fieldErrorsFrom(parsed.error))
  }
  const { warId, attackId, ...fields } = parsed.data

  const war = await getWar(warId)
  if (!war) return fail(NOT_FOUND)
  const existing = war.attacks.find((a) => a.id === attackId)
  if (!existing) return fail("Attack not found")

  if (fields.targetPosition > war.size) {
    return fail("Base number out of range", {
      targetPosition: `This war has bases 1 to ${war.size}`,
    })
  }
  const windowIssue = attackWindowIssue(fields.attackedAt, war.startedAt)
  if (windowIssue) return fail(windowIssue, { attackedAt: windowIssue })

  // The latest edit defines the base's Town Hall for every attack that hit it.
  await saveAttacks(
    warId,
    war.attacks.map((a) => {
      if (a.id === attackId) return { ...a, ...fields }
      return a.targetPosition === fields.targetPosition
        ? { ...a, targetTownHall: fields.targetTownHall }
        : a
    })
  )

  refresh()
  return ok()
}

export async function deleteAttack(
  warId: string,
  attackId: string
): Promise<ActionResult> {
  if (!isObjectIdString(warId)) return fail(NOT_FOUND)
  const war = await getWar(warId)
  if (!war) return fail(NOT_FOUND)
  if (!war.attacks.some((a) => a.id === attackId)) {
    return fail("Attack not found")
  }

  await saveAttacks(
    warId,
    war.attacks.filter((a) => a.id !== attackId)
  )

  refresh()
  return ok()
}
