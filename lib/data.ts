import "server-only"

import { cache } from "react"
import { ObjectId } from "mongodb"

import {
  playersCollection,
  seasonsCollection,
  warsCollection,
  type PlayerDoc,
  type SeasonDoc,
  type WarDoc,
} from "./db"
import type { PlayerDTO, SeasonDTO, WarDTO } from "./types"
import { isObjectIdString } from "./validation"

export function toPlayerDTO(doc: PlayerDoc): PlayerDTO {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    tag: doc.tag,
    townHall: doc.townHall,
    role: doc.role,
    active: doc.active,
    createdAt: doc.createdAt.toISOString(),
  }
}

export function toWarDTO(doc: WarDoc): WarDTO {
  return {
    id: doc._id.toHexString(),
    type: doc.type,
    opponent: doc.opponent,
    size: doc.size,
    attacksPerMember: doc.attacksPerMember,
    startedAt: doc.startedAt.toISOString(),
    status: doc.status,
    roster: doc.roster.map((entry) => ({
      playerId: entry.playerId.toHexString(),
      townHall: entry.townHall,
    })),
    attacks: doc.attacks.map((attack) => ({
      id: attack.id,
      playerId: attack.playerId.toHexString(),
      order: attack.order,
      stars: attack.stars,
      destruction: attack.destruction,
      durationSec: attack.durationSec,
      attackedAt: attack.attackedAt.toISOString(),
      targetPosition: attack.targetPosition,
      targetTownHall: attack.targetTownHall,
    })),
    opponentStars: doc.opponentStars,
    opponentDestruction: doc.opponentDestruction,
    notes: doc.notes,
    createdAt: doc.createdAt.toISOString(),
    seasonId: doc.seasonId?.toHexString() ?? null,
    day: doc.day ?? null,
  }
}

export function toSeasonDTO(doc: SeasonDoc): SeasonDTO {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    league: doc.league,
    size: doc.size,
    rosterIds: doc.roster.map((id) => id.toHexString()),
    finalRank: doc.finalRank,
    notes: doc.notes,
    createdAt: doc.createdAt.toISOString(),
  }
}

export const getPlayers = cache(async (): Promise<PlayerDTO[]> => {
  const players = await playersCollection()
  const docs = await players.find().sort({ active: -1, name: 1 }).toArray()
  return docs.map(toPlayerDTO)
})

export const getWars = cache(async (): Promise<WarDTO[]> => {
  const wars = await warsCollection()
  const docs = await wars.find().sort({ startedAt: -1 }).toArray()
  return docs.map(toWarDTO)
})

export async function getPlayer(id: string): Promise<PlayerDTO | null> {
  if (!isObjectIdString(id)) return null
  const players = await playersCollection()
  const doc = await players.findOne({ _id: new ObjectId(id) })
  return doc ? toPlayerDTO(doc) : null
}

export async function getWar(id: string): Promise<WarDTO | null> {
  if (!isObjectIdString(id)) return null
  const wars = await warsCollection()
  const doc = await wars.findOne({ _id: new ObjectId(id) })
  return doc ? toWarDTO(doc) : null
}

export const getSeasons = cache(async (): Promise<SeasonDTO[]> => {
  const seasons = await seasonsCollection()
  const docs = await seasons.find().sort({ createdAt: -1 }).toArray()
  return docs.map(toSeasonDTO)
})

export async function getSeason(id: string): Promise<SeasonDTO | null> {
  if (!isObjectIdString(id)) return null
  const seasons = await seasonsCollection()
  const doc = await seasons.findOne({ _id: new ObjectId(id) })
  return doc ? toSeasonDTO(doc) : null
}
