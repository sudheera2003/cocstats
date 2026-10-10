import { CWL_DAYS, CWL_WIN_BONUS_STARS } from "./constants"
import {
  computePlayerStats,
  flattenAttacks,
  summarize,
  warOutcome,
  warScore,
  type PlayerStats,
  type Summary,
  type WarOutcome,
  type WarScore,
} from "./stats"
import type { WarDTO } from "./types"

export interface CwlDay {
  day: number
  war: WarDTO | null
  score: WarScore | null
  outcome: WarOutcome | null
}

export interface SeasonStandings {
  /** Always CWL_DAYS entries, in day order; days not started yet have no war. */
  days: CwlDay[]
  played: number
  completed: number
  wins: number
  losses: number
  ties: number
  warStars: number
  /** Bonus stars for winning days: what the league standing adds on top of war stars. */
  bonusStars: number
  /** The number clans are ranked by. */
  totalStars: number
  /** Sum of each day's destruction %, the tiebreaker when total stars are level. */
  totalDestruction: number
  summary: Summary
  /** Attacks left unused in days that have ended. */
  missed: number
}

export function computeSeasonStandings(wars: WarDTO[]): SeasonStandings {
  const byDay = new Map(
    wars.flatMap((war) => (war.day ? [[war.day, war] as const] : []))
  )
  let wins = 0
  let losses = 0
  let ties = 0
  let warStars = 0
  let totalDestruction = 0
  let missed = 0

  const days: CwlDay[] = Array.from({ length: CWL_DAYS }, (_, i) => {
    const day = i + 1
    const war = byDay.get(day) ?? null
    if (!war) return { day, war: null, score: null, outcome: null }

    const score = warScore(war)
    const outcome = warOutcome(war, score)
    if (outcome === "win") wins += 1
    if (outcome === "loss") losses += 1
    if (outcome === "tie") ties += 1
    warStars += score.stars
    totalDestruction += score.destruction
    if (war.status === "ended") {
      missed += Math.max(0, score.attacksAvailable - score.attacksUsed)
    }
    return { day, war, score, outcome }
  })

  const bonusStars = wins * CWL_WIN_BONUS_STARS
  return {
    days,
    played: days.filter((d) => d.war).length,
    completed: days.filter((d) => d.war?.status === "ended").length,
    wins,
    losses,
    ties,
    warStars,
    bonusStars,
    totalStars: warStars + bonusStars,
    totalDestruction,
    summary: summarize(flattenAttacks(wars)),
    missed,
  }
}

export interface SeasonPlayerRow {
  playerId: string
  stats: PlayerStats
  /** Days this player was in the lineup. */
  daysInLineup: number
  /** Days they were registered for the season but left out of the lineup. */
  daysBenched: number
}

export function computeSeasonPlayers(
  rosterIds: string[],
  wars: WarDTO[]
): SeasonPlayerRow[] {
  const stats = computePlayerStats(rosterIds, wars)
  return rosterIds.map((playerId) => {
    const daysInLineup = wars.filter((war) =>
      war.roster.some((entry) => entry.playerId === playerId)
    ).length
    return {
      playerId,
      stats: stats.get(playerId)!,
      daysInLineup,
      daysBenched: wars.length - daysInLineup,
    }
  })
}
