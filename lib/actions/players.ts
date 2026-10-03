"use server"

import { revalidatePath } from "next/cache"
import { MongoServerError, ObjectId } from "mongodb"

import { fail, ok } from "@/lib/actions/result"
import { playersCollection, warsCollection } from "@/lib/db"
import type { ActionResult } from "@/lib/types"
import {
  fieldErrorsFrom,
  isObjectIdString,
  playerSchema,
  type PlayerInput,
} from "@/lib/validation"

const DUPLICATE_TAG = "That tag already belongs to another player"

function isDuplicateKey(error: unknown) {
  return error instanceof MongoServerError && error.code === 11000
}

export async function createPlayer(
  input: PlayerInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = playerSchema.safeParse(input)
  if (!parsed.success) {
    return fail("Check the highlighted fields", fieldErrorsFrom(parsed.error))
  }
  const { name, tag, townHall, role } = parsed.data

  const players = await playersCollection()
  const _id = new ObjectId()
  try {
    await players.insertOne({
      _id,
      name,
      tag: tag || null,
      townHall,
      role,
      active: true,
      createdAt: new Date(),
    })
  } catch (error) {
    if (isDuplicateKey(error))
      return fail(DUPLICATE_TAG, { tag: DUPLICATE_TAG })
    throw error
  }

  revalidatePath("/", "layout")
  return ok({ id: _id.toHexString() })
}

export async function updatePlayer(
  id: string,
  input: PlayerInput
): Promise<ActionResult> {
  if (!isObjectIdString(id)) return fail("Player not found")
  const parsed = playerSchema.safeParse(input)
  if (!parsed.success) {
    return fail("Check the highlighted fields", fieldErrorsFrom(parsed.error))
  }
  const { name, tag, townHall, role } = parsed.data

  const players = await playersCollection()
  try {
    const result = await players.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, tag: tag || null, townHall, role } }
    )
    if (result.matchedCount === 0) return fail("Player not found")
  } catch (error) {
    if (isDuplicateKey(error))
      return fail(DUPLICATE_TAG, { tag: DUPLICATE_TAG })
    throw error
  }

  revalidatePath("/", "layout")
  return ok()
}

export async function setPlayerActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  if (!isObjectIdString(id)) return fail("Player not found")
  const players = await playersCollection()
  const result = await players.updateOne(
    { _id: new ObjectId(id) },
    { $set: { active: Boolean(active) } }
  )
  if (result.matchedCount === 0) return fail("Player not found")

  revalidatePath("/", "layout")
  return ok()
}

export async function deletePlayer(id: string): Promise<ActionResult> {
  if (!isObjectIdString(id)) return fail("Player not found")
  const _id = new ObjectId(id)

  const wars = await warsCollection()
  const warCount = await wars.countDocuments({ "roster.playerId": _id })
  if (warCount > 0) {
    return fail(
      `This player is in ${warCount} war${warCount === 1 ? "" : "s"}. Mark them inactive instead to keep their stats.`
    )
  }

  const players = await playersCollection()
  const result = await players.deleteOne({ _id })
  if (result.deletedCount === 0) return fail("Player not found")

  // No revalidation on purpose: deleting from the player's own page would
  // re-render that page and flash a 404 before the client navigates away.
  // Callers refresh or navigate themselves.
  return ok()
}
