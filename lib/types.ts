import type { PlayerRole, WarStatus, WarType } from "./constants"

export interface PlayerDTO {
  id: string
  name: string
  tag: string | null
  townHall: number
  role: PlayerRole
  active: boolean
  createdAt: string
}

export interface AttackDTO {
  id: string
  playerId: string
  /** 1-based position among this player's attacks in the war. */
  order: number
  stars: number
  destruction: number
  durationSec: number | null
  attackedAt: string
  /** Map position (1-based) of the enemy base that was attacked. */
  targetPosition: number
  /** Town Hall level of the enemy base. Required for new attacks. */
  targetTownHall: number | null
}

export interface RosterEntryDTO {
  playerId: string
  /** Town hall level at the time of the war. */
  townHall: number
}

export interface WarDTO {
  id: string
  type: WarType
  opponent: string
  size: number
  attacksPerMember: number
  startedAt: string
  status: WarStatus
  roster: RosterEntryDTO[]
  attacks: AttackDTO[]
  opponentStars: number | null
  opponentDestruction: number | null
  notes: string
  createdAt: string
  /** Set for CWL days: the season this war belongs to. */
  seasonId: string | null
  /** Which of the 7 CWL days this war is (1-7). */
  day: number | null
}

export interface SeasonDTO {
  id: string
  name: string
  league: string | null
  /** Players per side in each daily war (15 or 30). */
  size: number
  /** Everyone registered for the season; each day's lineup is picked from here. */
  rosterIds: string[]
  /** Final placement in the group of 8, once known. */
  finalRank: number | null
  notes: string
  createdAt: string
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
