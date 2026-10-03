"use server"

import { revalidatePath } from "next/cache"
import { MongoServerError, ObjectId } from "mongodb"

import { fail, ok } from "@/lib/actions/result"
import { getSeason } from "@/lib/data"
import { playersCollection, seasonsCollection, warsCollection } from "@/lib/db"
import type { ActionResult } from "@/lib/types"
import {
  createCwlDaySchema,
  createSeasonSchema,
  fieldErrorsFrom,
  isObjectIdString,
  seasonRosterSchema,
  updateSeasonSchema,
  type CreateCwlDayInput,
  type CreateSeasonInput,
  type UpdateSeasonInput,
} from "@/lib/validation"

const NOT_FOUND = "Season not found"
const CHECK_FIELDS = "Check the highlighted fields"

function refresh() {
  revalidatePath("/", "layout")
}

function floorToMinute(date: Date) {
  return new Date(Math.floor(date.getTime() / 60_000) * 60_000)
}

/** Maps player ids to their current Town Hall, or null when any of them no longer exists. */
async function currentTownHalls(playerIds: string[]) {
  const players = await playersCollection()
  const found = await players
    .find({ _id: { $in: playerIds.map((id) => new ObjectId(id)) } })
    .toArray()
  if (found.length !== playerIds.length) return null
  return new Map(found.map((p) => [p._id.toHexString(), p.townHall]))
}

export async function createSeason(
  input: CreateSeasonInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSeasonSchema.safeParse(input)
  if (!parsed.success) {
    return fail(CHECK_FIELDS, fieldErrorsFrom(parsed.error))
  }
  const { name, league, notes, size, playerIds } = parsed.data

  if ((await currentTownHalls(playerIds)) === null) {
    return fail("Some of the selected players no longer exist", {
      playerIds: "Refresh the page and pick the roster again",
    })
  }

  const seasons = await seasonsCollection()
  const _id = new ObjectId()
  await seasons.insertOne({
    _id,
    name,
    league: league || null,
    size,
    roster: playerIds.map((id) => new ObjectId(id)),
    finalRank: null,
    notes,
    createdAt: new Date(),
  })

  refresh()
  return ok({ id: _id.toHexString() })
}

export async function updateSeason(
  input: UpdateSeasonInput
): Promise<ActionResult> {
  const parsed = updateSeasonSchema.safeParse(input)
  if (!parsed.success) {
    return fail(CHECK_FIELDS, fieldErrorsFrom(parsed.error))
  }
  const { seasonId, name, league, notes, finalRank } = parsed.data

  const seasons = await seasonsCollection()
  const result = await seasons.updateOne(
    { _id: new ObjectId(seasonId) },
    { $set: { name, league: league || null, notes, finalRank } }
  )
  if (result.matchedCount === 0) return fail(NOT_FOUND)

  refresh()
  return ok()
}

export async function updateSeasonRoster(input: {
  seasonId: string
  playerIds: string[]
}): Promise<ActionResult> {
  const parsed = seasonRosterSchema.safeParse(input)
  if (!parsed.success) {
    return fail(CHECK_FIELDS, fieldErrorsFrom(parsed.error))
  }
  const { seasonId, playerIds } = parsed.data

  const season = await getSeason(seasonId)
  if (!season) return fail(NOT_FOUND)

  const wars = await warsCollection()
  const seasonWars = await wars
    .find({ seasonId: new ObjectId(seasonId) })
    .toArray()
  const inLineup = new Set(
    seasonWars.flatMap((war) => war.roster.map((e) => e.playerId.toHexString()))
  )
  const selected = new Set(playerIds)
  if ([...inLineup].some((id) => !selected.has(id))) {
    return fail("Players who have fought a day can't be removed", {
      playerIds: "Delete the day, or remove them from its lineup, first",
    })
  }

  if ((await currentTownHalls(playerIds)) === null) {
    return fail("Some of the selected players no longer exist", {
      playerIds: "Refresh the page and pick the roster again",
    })
  }

  const seasons = await seasonsCollection()
  await seasons.updateOne(
    { _id: new ObjectId(seasonId) },
    { $set: { roster: playerIds.map((id) => new ObjectId(id)) } }
  )

  refresh()
  return ok()
}

export async function deleteSeason(seasonId: string): Promise<ActionResult> {
  if (!isObjectIdString(seasonId)) return fail(NOT_FOUND)
  const _id = new ObjectId(seasonId)

  const seasons = await seasonsCollection()
  const result = await seasons.deleteOne({ _id })
  if (result.deletedCount === 0) return fail(NOT_FOUND)
  const wars = await warsCollection()
  await wars.deleteMany({ seasonId: _id })

  // No revalidation: see deleteWar. The caller navigates away from this season.
  return ok()
}

export async function createCwlDay(
  input: CreateCwlDayInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = createCwlDaySchema.safeParse(input)
  if (!parsed.success) {
    return fail(CHECK_FIELDS, fieldErrorsFrom(parsed.error))
  }
  const { seasonId, day, opponent, startedAt, playerIds } = parsed.data

  const season = await getSeason(seasonId)
  if (!season) return fail(NOT_FOUND)

  if (playerIds.length > season.size) {
    return fail(
      `A ${season.size}v${season.size} CWL lineup fits at most ${season.size} players`,
      { playerIds: `Select at most ${season.size} players` }
    )
  }
  const pool = new Set(season.rosterIds)
  if (playerIds.some((id) => !pool.has(id))) {
    return fail("Lineups come from the season roster", {
      playerIds: "Add the player to the season roster first",
    })
  }

  const wars = await warsCollection()
  const seasonObjectId = new ObjectId(seasonId)
  const sameOpponent = await wars.findOne(
    { seasonId: seasonObjectId, opponent },
    { collation: { locale: "en", strength: 2 } }
  )
  if (sameOpponent) {
    return fail("You already fought that clan this season", {
      opponent: `Already fought on day ${sameOpponent.day}. Each clan is faced once.`,
    })
  }

  const townHalls = await currentTownHalls(playerIds)
  if (!townHalls) {
    return fail("Some of the selected players no longer exist", {
      playerIds: "Refresh the page and pick the lineup again",
    })
  }

  const _id = new ObjectId()
  try {
    await wars.insertOne({
      _id,
      type: "cwl",
      opponent,
      size: season.size,
      attacksPerMember: 1,
      startedAt: startedAt ? new Date(startedAt) : floorToMinute(new Date()),
      status: "ongoing",
      roster: playerIds.map((id) => ({
        playerId: new ObjectId(id),
        townHall: townHalls.get(id)!,
      })),
      attacks: [],
      opponentStars: null,
      opponentDestruction: null,
      notes: "",
      createdAt: new Date(),
      seasonId: seasonObjectId,
      day,
    })
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return fail(`Day ${day} already has a war`, {
        day: "That day is taken. Pick another.",
      })
    }
    throw error
  }

  refresh()
  return ok({ id: _id.toHexString() })
}
