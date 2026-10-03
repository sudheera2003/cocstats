import "server-only"

import { MongoClient, type Collection, type Db, type ObjectId } from "mongodb"

import type { PlayerRole, WarStatus, WarType } from "./constants"

export interface PlayerDoc {
  _id: ObjectId
  name: string
  tag: string | null
  townHall: number
  role: PlayerRole
  active: boolean
  createdAt: Date
}

export interface AttackDoc {
  id: string
  playerId: ObjectId
  order: number
  stars: number
  destruction: number
  durationSec: number | null
  attackedAt: Date
  targetPosition: number
  targetTownHall: number | null
}

export interface WarDoc {
  _id: ObjectId
  type: WarType
  opponent: string
  size: number
  attacksPerMember: number
  startedAt: Date
  status: WarStatus
  roster: { playerId: ObjectId; townHall: number }[]
  attacks: AttackDoc[]
  opponentStars: number | null
  opponentDestruction: number | null
  notes: string
  createdAt: Date
  seasonId: ObjectId | null
  day: number | null
}

export interface SeasonDoc {
  _id: ObjectId
  name: string
  league: string | null
  size: number
  roster: ObjectId[]
  finalRank: number | null
  notes: string
  createdAt: Date
}

// Kept on globalThis so dev-server hot reloads reuse one connection pool.
const cache = globalThis as typeof globalThis & {
  __cocstatsClient?: Promise<MongoClient>
  __cocstatsIndexes?: Promise<unknown>
}

function connect() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local.")
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 })
  return client.connect().catch((error) => {
    cache.__cocstatsClient = undefined
    throw error
  })
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db
      .collection<PlayerDoc>("players")
      .createIndex(
        { tag: 1 },
        { unique: true, partialFilterExpression: { tag: { $type: "string" } } }
      ),
    db.collection<WarDoc>("wars").createIndex({ startedAt: -1 }),
    db.collection<WarDoc>("wars").createIndex({ "roster.playerId": 1 }),
    // One war per CWL day within a season.
    db.collection<WarDoc>("wars").createIndex(
      { seasonId: 1, day: 1 },
      {
        unique: true,
        partialFilterExpression: { seasonId: { $type: "objectId" } },
      }
    ),
  ])
}

export async function getDb() {
  cache.__cocstatsClient ??= connect()
  const client = await cache.__cocstatsClient
  const db = client.db(process.env.MONGODB_DB ?? "cocstats")
  cache.__cocstatsIndexes ??= ensureIndexes(db).catch((error) => {
    cache.__cocstatsIndexes = undefined
    throw error
  })
  await cache.__cocstatsIndexes
  return db
}

export async function playersCollection(): Promise<Collection<PlayerDoc>> {
  return (await getDb()).collection<PlayerDoc>("players")
}

export async function warsCollection(): Promise<Collection<WarDoc>> {
  return (await getDb()).collection<WarDoc>("wars")
}

export async function seasonsCollection(): Promise<Collection<SeasonDoc>> {
  return (await getDb()).collection<SeasonDoc>("seasons")
}
