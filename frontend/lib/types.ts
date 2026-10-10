// The shapes the backend returns. backend/src/types.ts mirrors this file: the two
// folders deploy separately, so the contract is kept in sync by hand.

import type { PlayerRole, WarPhase, WarStatus, WarType } from "./constants"

export interface LeagueDTO {
  name: string
  icon: string | null
}

export interface PlayerDTO {
  /** The player tag without its #, safe to put in a URL. */
  id: string
  name: string
  tag: string
  townHall: number
  role: PlayerRole
  /** Still in the clan. Former members only show up through the wars they fought. */
  active: boolean
  expLevel: number | null
  trophies: number | null
  league: LeagueDTO | null
  donations: number | null
  donationsReceived: number | null
}

export interface AttackDTO {
  id: string
  playerId: string
  /** 1-based position among this player's attacks in the war. */
  order: number
  /** Where the attack came in the whole war, both clans counted. */
  sequence: number
  stars: number
  destruction: number
  durationSec: number | null
  /** Map position (1-based) of the enemy base that was attacked. */
  targetPosition: number
  targetTownHall: number | null
  targetName: string | null
}

export interface RosterEntryDTO {
  playerId: string
  name: string
  /** Town hall level at the time of the war. */
  townHall: number
  /** 1-based map position in our lineup. */
  position: number
}

export interface EnemyBaseDTO {
  tag: string
  name: string
  townHall: number
  position: number
}

export interface WarDTO {
  id: string
  type: WarType
  opponent: string
  opponentTag: string
  opponentBadge: string | null
  size: number
  attacksPerMember: number
  phase: WarPhase
  status: WarStatus
  preparationStartedAt: string
  /** When battle day starts. */
  startedAt: string
  endsAt: string
  roster: RosterEntryDTO[]
  attacks: AttackDTO[]
  enemyBases: EnemyBaseDTO[]
  opponentStars: number | null
  opponentDestruction: number | null
  /** Set for CWL days: the season this war belongs to. */
  seasonId: string | null
  /** Which of the 7 CWL days this war is (1-7). */
  day: number | null
}

/** A finished war from the clan's war log: the score only, no individual attacks. */
export interface WarLogEntryDTO {
  id: string
  /** A CWL season shows up in the log as one combined entry with no opponent. */
  type: WarType
  result: "win" | "loss" | "tie" | null
  endedAt: string
  size: number
  attacksPerMember: number
  opponent: string | null
  opponentTag: string | null
  stars: number
  destruction: number
  attacksUsed: number
  opponentStars: number
  opponentDestruction: number
}

export interface WarsDTO {
  /** Wars with every attack: the current war plus each day of the current CWL season. Newest first. */
  wars: WarDTO[]
  /** Newest first. */
  warLog: WarLogEntryDTO[]
  /** False when the clan hides its war log, which also hides the current war from the API. */
  warLogPublic: boolean
}

export interface SeasonStandingDTO {
  tag: string
  name: string
  badge: string | null
  rank: number
  /** War stars plus the bonus for each war won. */
  stars: number
  destruction: number
  wins: number
  losses: number
  ties: number
  isUs: boolean
}

export interface SeasonDTO {
  /** e.g. "2026-10". */
  id: string
  name: string
  league: string | null
  state: WarPhase
  /** Players per side in each daily war (15 or 30). */
  size: number
  /** Everyone registered for the season; each day's lineup is picked from here. */
  rosterIds: string[]
  /** Our position in the group right now, or the final one once the season has ended. */
  rank: number | null
  standings: SeasonStandingDTO[]
}

export interface ClanDTO {
  tag: string
  name: string
  description: string
  badge: string | null
  level: number
  points: number
  memberCount: number
  location: string | null
  warLeague: string | null
  warFrequency: string | null
  warWins: number
  /** Only reported when the war log is public. */
  warLosses: number | null
  warTies: number | null
  warWinStreak: number
  warLogPublic: boolean
  /** True when the backend is serving generated sample data instead of the real clan. */
  sample: boolean
}

export interface PlayerProfileDTO {
  tag: string
  name: string
  townHall: number
  expLevel: number
  trophies: number
  bestTrophies: number
  warStars: number
  attackWins: number
  defenseWins: number
  donations: number
  donationsReceived: number
  clanCapitalContributions: number
  warPreference: "in" | "out" | null
  league: LeagueDTO | null
  heroes: { name: string; level: number; maxLevel: number }[]
}
