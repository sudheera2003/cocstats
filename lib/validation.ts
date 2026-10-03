import { z } from "zod"

import {
  ATTACK_WINDOW_MS,
  CWL_DAYS,
  CWL_GROUP_SIZE,
  CWL_LEAGUES,
  CWL_SIZES,
  MAX_ATTACK_SECONDS,
  MAX_CWL_ROSTER,
  MAX_TOWN_HALL,
  MAX_WAR_SIZE,
  PLAYER_ROLES,
  WAR_TYPE_META,
  WAR_TYPES,
  type WarType,
} from "./constants"

const TAG_PATTERN = /^#[0289PYLQGRJCUV]{3,12}$/

/** Uppercases, swaps the letter O for zero (tags never contain O) and adds the leading #. */
export function normalizeTag(raw: string) {
  const tag = raw.trim().toUpperCase().replace(/O/g, "0")
  if (tag === "") return ""
  return tag.startsWith("#") ? tag : `#${tag}`
}

export function isValidSize(type: WarType, size: number) {
  return WAR_TYPE_META[type].sizes.includes(size)
}

/** Explains why a stars/destruction pair can't happen in-game, or null when it can. */
export function attackConsistencyIssue(stars: number, destruction: number) {
  if (destruction === 100 && stars !== 3) {
    return "100% destruction is always 3 stars"
  }
  if (stars === 3 && destruction !== 100) {
    return "3 stars requires 100% destruction"
  }
  if (destruction >= 50 && stars === 0) {
    return "50% or more destruction earns at least 1 star"
  }
  if (stars === 2 && destruction < 50) {
    return "2 stars requires at least 50% destruction"
  }
  return null
}

export function fieldErrorsFrom(error: z.ZodError) {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "form"
    if (!(key in errors)) errors[key] = issue.message
  }
  return errors
}

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i

export function isObjectIdString(value: string) {
  return OBJECT_ID_PATTERN.test(value)
}

const objectId = z.string().regex(OBJECT_ID_PATTERN, "Invalid id")
const isoDateTime = z.iso.datetime({ message: "Pick a valid date and time" })

export const playerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(32, "Keep it under 32 characters"),
  tag: z
    .string()
    .trim()
    .max(16, "Tag is too long")
    .transform(normalizeTag)
    .refine(
      (tag) => tag === "" || TAG_PATTERN.test(tag),
      "Not a valid player tag, e.g. #2PP0JCCL"
    ),
  townHall: z
    .number("Pick a town hall level")
    .int()
    .min(1, "Pick a town hall level")
    .max(MAX_TOWN_HALL, `Town hall can't exceed ${MAX_TOWN_HALL}`),
  role: z.enum(PLAYER_ROLES),
})
export type PlayerInput = z.input<typeof playerSchema>

const warDetailsShape = {
  opponent: z
    .string()
    .trim()
    .min(1, "Opponent name is required")
    .max(40, "Keep it under 40 characters"),
  type: z.enum(WAR_TYPES),
  size: z.number().int().min(1).max(MAX_WAR_SIZE),
  attacksPerMember: z.number().int().min(1).max(2),
  notes: z.string().trim().max(500, "Keep notes under 500 characters"),
}

function checkSize(
  data: { type: WarType; size: number },
  ctx: z.RefinementCtx
) {
  if (!isValidSize(data.type, data.size)) {
    ctx.addIssue({
      code: "custom",
      path: ["size"],
      message: `${WAR_TYPE_META[data.type].short} wars can only be ${WAR_TYPE_META[
        data.type
      ].sizes.join(", ")} players per side`,
    })
  }
}

export const createWarSchema = z
  .object({
    ...warDetailsShape,
    // CWL wars are created from a season, one per day.
    type: z.enum(["regular", "friendly"]),
    startedAt: isoDateTime.nullable(),
    playerIds: z
      .array(objectId)
      .min(1, "Select at least one player")
      .refine((ids) => new Set(ids).size === ids.length, "Duplicate players"),
  })
  .superRefine((data, ctx) => {
    checkSize(data, ctx)
    if (data.playerIds.length > data.size) {
      ctx.addIssue({
        code: "custom",
        path: ["playerIds"],
        message: `A ${data.size}v${data.size} war fits at most ${data.size} players`,
      })
    }
  })
export type CreateWarInput = z.input<typeof createWarSchema>

export const updateWarSchema = z
  .object({
    warId: objectId,
    ...warDetailsShape,
    startedAt: isoDateTime,
    ended: z.boolean(),
    opponentStars: z.number().int().min(0).nullable(),
    opponentDestruction: z
      .number("Enter a percentage")
      .min(0, "Between 0 and 100")
      .max(100, "Between 0 and 100")
      .nullable(),
  })
  .superRefine((data, ctx) => {
    checkSize(data, ctx)
    if (data.opponentStars !== null && data.opponentStars > data.size * 3) {
      ctx.addIssue({
        code: "custom",
        path: ["opponentStars"],
        message: `At most ${data.size * 3} stars in a ${data.size}v${data.size} war`,
      })
    }
  })
export type UpdateWarInput = z.input<typeof updateWarSchema>

export const rosterSchema = z.object({
  warId: objectId,
  playerIds: z
    .array(objectId)
    .min(1, "Select at least one player")
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate players"),
})

const playerIdList = z
  .array(objectId)
  .min(1, "Select at least one player")
  .max(MAX_CWL_ROSTER, `At most ${MAX_CWL_ROSTER} players`)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate players")

const leagueField = z
  .string()
  .refine(
    (league) => league === "" || CWL_LEAGUES.includes(league),
    "Unknown league"
  )

const seasonDetailsShape = {
  name: z
    .string()
    .trim()
    .min(1, "Season name is required")
    .max(40, "Keep it under 40 characters"),
  league: leagueField,
  notes: z.string().trim().max(500, "Keep notes under 500 characters"),
}

export const createSeasonSchema = z.object({
  ...seasonDetailsShape,
  size: z
    .number()
    .int()
    .refine((size) => CWL_SIZES.includes(size), "CWL wars are 15v15 or 30v30"),
  playerIds: playerIdList,
})
export type CreateSeasonInput = z.input<typeof createSeasonSchema>

export const updateSeasonSchema = z.object({
  seasonId: objectId,
  ...seasonDetailsShape,
  finalRank: z
    .number("Enter a number from 1 to 8")
    .int("Enter a number from 1 to 8")
    .min(1, "Enter a number from 1 to 8")
    .max(CWL_GROUP_SIZE, "Enter a number from 1 to 8")
    .nullable(),
})
export type UpdateSeasonInput = z.input<typeof updateSeasonSchema>

export const seasonRosterSchema = z.object({
  seasonId: objectId,
  playerIds: playerIdList,
})

export const createCwlDaySchema = z.object({
  seasonId: objectId,
  day: z.number().int().min(1).max(CWL_DAYS),
  opponent: warDetailsShape.opponent,
  startedAt: isoDateTime.nullable(),
  playerIds: z
    .array(objectId)
    .min(1, "Select at least one player")
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate players"),
})
export type CreateCwlDayInput = z.input<typeof createCwlDaySchema>

const attackShape = {
  stars: z.number("Pick the stars earned").int().min(0).max(3),
  destruction: z
    .number("Enter the destruction percentage")
    .int("Use a whole number")
    .min(0, "Between 0 and 100")
    .max(100, "Between 0 and 100"),
  durationSec: z
    .number()
    .int()
    .min(0)
    .max(MAX_ATTACK_SECONDS, "Attacks last 3:00 at most")
    .nullable(),
  attackedAt: isoDateTime,
  targetPosition: z
    .number("Enter the enemy base number")
    .int("Use a whole number")
    .min(1, "Base numbers start at 1")
    .max(MAX_WAR_SIZE),
  targetTownHall: z
    .number("Pick the enemy Town Hall")
    .int()
    .min(1, "Pick the enemy Town Hall")
    .max(MAX_TOWN_HALL),
}

function checkAttack(
  data: { stars: number; destruction: number },
  ctx: z.RefinementCtx
) {
  const issue = attackConsistencyIssue(data.stars, data.destruction)
  if (issue) {
    ctx.addIssue({ code: "custom", path: ["destruction"], message: issue })
  }
}

export const attackFieldsSchema = z.object(attackShape).superRefine(checkAttack)
export type AttackFieldsInput = z.input<typeof attackFieldsSchema>

export const addAttackSchema = z
  .object({ warId: objectId, playerId: objectId, ...attackShape })
  .superRefine(checkAttack)

export const updateAttackSchema = z
  .object({ warId: objectId, attackId: z.string().min(1), ...attackShape })
  .superRefine(checkAttack)

// <input type="datetime-local"> only goes down to the minute, so an attack
// logged straight after a war starts can land a few seconds "before" it.
const START_TOLERANCE_MS = 60 * 1000

export function attackWindowIssue(
  attackedAtIso: string,
  warStartedAtIso: string
) {
  const attackedAt = new Date(attackedAtIso).getTime()
  const startedAt = new Date(warStartedAtIso).getTime()
  if (attackedAt < startedAt - START_TOLERANCE_MS) {
    return "That's before the war started"
  }
  if (attackedAt > startedAt + ATTACK_WINDOW_MS) {
    return "That's more than 48 hours after the war started"
  }
  return null
}
