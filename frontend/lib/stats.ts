import type { WarStatus, WarType } from "./constants"
import type { PlayerDTO, WarDTO } from "./types"

export interface AttackRow {
  id: string
  warId: string
  warOpponent: string
  warType: WarType
  warDay: number | null
  warStatus: WarStatus
  warStartedAt: string
  playerId: string
  attackerTownHall: number
  /** The attacker's map position in our lineup; a range only when it isn't known. */
  attackerRankLow: number
  attackerRankHigh: number
  order: number
  stars: number
  destruction: number
  durationSec: number | null
  /** Where the attack came in the whole war, both clans counted. */
  sequence: number
  targetPosition: number
  targetTownHall: number | null
  targetName: string | null
}

export interface Summary {
  attacks: number
  totalStars: number
  avgStars: number | null
  maxStars: number | null
  minStars: number | null
  avgDestruction: number | null
  maxDestruction: number | null
  minDestruction: number | null
  threeStars: number
  threeStarRate: number | null
  zeroStars: number
  /** Attack counts for 0, 1, 2 and 3 stars. */
  distribution: [number, number, number, number]
  avgDuration: number | null
  minDuration: number | null
  maxDuration: number | null
  fastestThreeStar: number | null
}

export interface PlayerStats extends Summary {
  playerId: string
  wars: number
  starsPerWar: number | null
  /** Attacks left unused in wars that have ended. */
  missed: number
  /** Share of available attacks used in wars that have ended. */
  usageRate: number | null
}

export type WarOutcome = "win" | "loss" | "tie" | "ongoing" | "unrecorded"

export interface WarScore {
  stars: number
  /** Average of the best destruction on each enemy base, unattacked bases count as 0. */
  destruction: number
  attacksUsed: number
  attacksAvailable: number
  basesHit: number
  basesThreeStarred: number
  /** Best stars earned on each attacked enemy base, keyed by base number. */
  bestByBase: Map<number, number>
}

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0)
const mean = (values: number[]) =>
  values.length > 0 ? sum(values) / values.length : null
const min = (values: number[]) =>
  values.length > 0 ? Math.min(...values) : null
const max = (values: number[]) =>
  values.length > 0 ? Math.max(...values) : null

export function flattenAttacks(wars: WarDTO[]): AttackRow[] {
  return wars.flatMap((war) => {
    const townHalls = new Map(war.roster.map((r) => [r.playerId, r.townHall]))
    return war.attacks.map((attack) => {
      const rank = attackerRankRange(war.roster, attack.playerId)
      return {
        id: attack.id,
        warId: war.id,
        warOpponent: war.opponent,
        warType: war.type,
        warDay: war.day,
        warStatus: war.status,
        warStartedAt: war.startedAt,
        playerId: attack.playerId,
        attackerTownHall: townHalls.get(attack.playerId) ?? 0,
        order: attack.order,
        stars: attack.stars,
        destruction: attack.destruction,
        durationSec: attack.durationSec,
        sequence: attack.sequence,
        targetPosition: attack.targetPosition,
        targetTownHall: attack.targetTownHall,
        targetName: attack.targetName,
        attackerRankLow: rank.low,
        attackerRankHigh: rank.high,
      }
    })
  })
}

export interface RankRange {
  low: number
  high: number
}

/**
 * Where a player sits in their clan's lineup: their map position in the war.
 * Someone who isn't in the lineup could be anywhere in it.
 */
export function attackerRankRange(
  roster: { playerId: string; position: number }[],
  playerId: string
): RankRange {
  const mine = roster.find((entry) => entry.playerId === playerId)?.position
  if (mine === undefined) return { low: 1, high: roster.length }
  return { low: mine, high: mine }
}

export interface RankMatchup {
  direction: Matchup
  /** How many map positions the target sat above (up) or below (down) the attacker's range. */
  positions: number
}

/**
 * Judges an attack by map position instead of Town Hall, so a weak enemy clan
 * doesn't punish our top players: our #1 hitting their #1 is a mirror whatever
 * Town Halls are involved. Lower base numbers are stronger.
 */
export function rankMatchup(
  range: RankRange,
  targetPosition: number
): RankMatchup {
  if (targetPosition < range.low) {
    return { direction: "up", positions: range.low - targetPosition }
  }
  if (targetPosition > range.high) {
    return { direction: "down", positions: targetPosition - range.high }
  }
  return { direction: "same", positions: 0 }
}

export function rowMatchup(row: AttackRow): RankMatchup {
  return rankMatchup(
    { low: row.attackerRankLow, high: row.attackerRankHigh },
    row.targetPosition
  )
}

export function summarize(rows: AttackRow[]): Summary {
  const stars = rows.map((r) => r.stars)
  const destruction = rows.map((r) => r.destruction)
  const durations = rows.flatMap((r) =>
    r.durationSec === null ? [] : [r.durationSec]
  )
  const threeStarDurations = rows.flatMap((r) =>
    r.stars === 3 && r.durationSec !== null ? [r.durationSec] : []
  )
  const distribution: [number, number, number, number] = [0, 0, 0, 0]
  for (const row of rows) distribution[row.stars] += 1

  return {
    attacks: rows.length,
    totalStars: sum(stars),
    avgStars: mean(stars),
    maxStars: max(stars),
    minStars: min(stars),
    avgDestruction: mean(destruction),
    maxDestruction: max(destruction),
    minDestruction: min(destruction),
    threeStars: distribution[3],
    threeStarRate: rows.length > 0 ? distribution[3] / rows.length : null,
    zeroStars: distribution[0],
    distribution,
    avgDuration: mean(durations),
    minDuration: min(durations),
    maxDuration: max(durations),
    fastestThreeStar: min(threeStarDurations),
  }
}

/** "all" and "overall" are every war (Regular plus CWL), anything else is one type. */
export function filterWars(wars: WarDTO[], type: WarType | "all" | "overall") {
  if (type === "all" || type === "overall") return wars
  return wars.filter((war) => war.type === type)
}

export function groupBy<T, K>(items: T[], key: (item: T) => K) {
  const groups = new Map<K, T[]>()
  for (const item of items) {
    const k = key(item)
    const group = groups.get(k)
    if (group) group.push(item)
    else groups.set(k, [item])
  }
  return groups
}

export function computePlayerStats(
  playerIds: string[],
  wars: WarDTO[]
): Map<string, PlayerStats> {
  const rowsByPlayer = groupBy(flattenAttacks(wars), (row) => row.playerId)
  const tallies = new Map(
    playerIds.map((id) => [id, { wars: 0, available: 0, used: 0 }])
  )

  for (const war of wars) {
    const usedByPlayer = new Map<string, number>()
    for (const attack of war.attacks) {
      usedByPlayer.set(
        attack.playerId,
        (usedByPlayer.get(attack.playerId) ?? 0) + 1
      )
    }
    for (const entry of war.roster) {
      const tally = tallies.get(entry.playerId)
      if (!tally) continue
      tally.wars += 1
      if (war.status === "ended") {
        tally.available += war.attacksPerMember
        tally.used += Math.min(
          usedByPlayer.get(entry.playerId) ?? 0,
          war.attacksPerMember
        )
      }
    }
  }

  const result = new Map<string, PlayerStats>()
  for (const playerId of playerIds) {
    const tally = tallies.get(playerId)!
    const summary = summarize(rowsByPlayer.get(playerId) ?? [])
    result.set(playerId, {
      ...summary,
      playerId,
      wars: tally.wars,
      starsPerWar: tally.wars > 0 ? summary.totalStars / tally.wars : null,
      missed: tally.available - tally.used,
      usageRate: tally.available > 0 ? tally.used / tally.available : null,
    })
  }
  return result
}

export function warScore(war: WarDTO): WarScore {
  const bestStars = new Map<number, number>()
  const bestDestruction = new Map<number, number>()
  for (const attack of war.attacks) {
    const base = attack.targetPosition
    bestStars.set(base, Math.max(bestStars.get(base) ?? 0, attack.stars))
    bestDestruction.set(
      base,
      Math.max(bestDestruction.get(base) ?? 0, attack.destruction)
    )
  }
  return {
    stars: sum([...bestStars.values()]),
    destruction:
      war.size > 0 ? sum([...bestDestruction.values()]) / war.size : 0,
    attacksUsed: war.attacks.length,
    attacksAvailable: war.roster.length * war.attacksPerMember,
    basesHit: bestStars.size,
    basesThreeStarred: [...bestStars.values()].filter((s) => s === 3).length,
    bestByBase: bestStars,
  }
}

export function warOutcome(war: WarDTO, score = warScore(war)): WarOutcome {
  if (war.status === "ongoing") return "ongoing"
  if (war.opponentStars === null || war.opponentDestruction === null) {
    return "unrecorded"
  }
  if (score.stars !== war.opponentStars) {
    return score.stars > war.opponentStars ? "win" : "loss"
  }
  const gap = score.destruction - war.opponentDestruction
  if (Math.abs(gap) < 0.005) return "tie"
  return gap > 0 ? "win" : "loss"
}

export interface WarTrendPoint {
  warId: string
  label: string
  date: string
  status: WarStatus
  stars: number
  destruction: number
  avgStars: number | null
}

export interface ClanStats {
  wars: number
  endedWars: number
  ongoingWars: number
  wins: number
  losses: number
  ties: number
  /** Wins out of wars whose result is known. */
  winRate: number | null
  summary: Summary
  missed: number
  usageRate: number | null
  /** Oldest first. */
  trend: WarTrendPoint[]
}

export function computeClanStats(wars: WarDTO[]): ClanStats {
  let wins = 0
  let losses = 0
  let ties = 0
  let available = 0
  let used = 0
  const trend: WarTrendPoint[] = []

  for (const war of wars) {
    const score = warScore(war)
    const outcome = warOutcome(war, score)
    if (outcome === "win") wins += 1
    if (outcome === "loss") losses += 1
    if (outcome === "tie") ties += 1
    if (war.status === "ended") {
      available += score.attacksAvailable
      used += score.attacksUsed
    }
    trend.push({
      warId: war.id,
      label: war.opponent,
      date: war.startedAt,
      status: war.status,
      stars: score.stars,
      destruction: score.destruction,
      avgStars:
        war.attacks.length > 0
          ? sum(war.attacks.map((a) => a.stars)) / war.attacks.length
          : null,
    })
  }
  trend.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  const decided = wins + losses + ties

  return {
    wars: wars.length,
    endedWars: wars.filter((w) => w.status === "ended").length,
    ongoingWars: wars.filter((w) => w.status === "ongoing").length,
    wins,
    losses,
    ties,
    winRate: decided > 0 ? wins / decided : null,
    summary: summarize(flattenAttacks(wars)),
    missed: Math.max(0, available - used),
    usageRate: available > 0 ? used / available : null,
    trend,
  }
}

export interface Breakdown {
  key: string
  summary: Summary
}

/** First attack vs second attack. */
export function breakdownByOrder(rows: AttackRow[]): Breakdown[] {
  return [...groupBy(rows, (row) => row.order)]
    .sort(([a], [b]) => a - b)
    .map(([order, group]) => ({
      key: `Attack ${order}`,
      summary: summarize(group),
    }))
}

export type Matchup = "up" | "same" | "down"

/** Attacks split by whether the base was ranked above, level with or below the attacker. */
export function breakdownByMatchup(rows: AttackRow[]): Map<Matchup, Summary> {
  const groups = groupBy(rows, (row) => rowMatchup(row).direction)
  return new Map([...groups].map(([key, group]) => [key, summarize(group)]))
}

export interface MatchupCounts {
  hitUps: number
  /** Stars earned on attacks against a base ranked above the attacker. */
  hitUpStars: number
  hitUpThreeStars: number
  /** Sum of how many map positions above the attacker each hit-up was. */
  hitUpPositions: number
  /** Attacks on a base level with the attacker's own rank. */
  mirrors: number
  hitDowns: number
  hitDownStars: number
}

/** Counts attacks on higher, level and lower ranked bases. */
export function summarizeMatchups(rows: AttackRow[]): MatchupCounts {
  const counts: MatchupCounts = {
    hitUps: 0,
    hitUpStars: 0,
    hitUpThreeStars: 0,
    hitUpPositions: 0,
    mirrors: 0,
    hitDowns: 0,
    hitDownStars: 0,
  }
  for (const row of rows) {
    const { direction, positions } = rowMatchup(row)
    if (direction === "up") {
      counts.hitUps += 1
      counts.hitUpPositions += positions
      counts.hitUpStars += row.stars
      if (row.stars === 3) counts.hitUpThreeStars += 1
    } else if (direction === "down") {
      counts.hitDowns += 1
      counts.hitDownStars += row.stars
    } else {
      counts.mirrors += 1
    }
  }
  return counts
}

/** Attacks grouped by the Town Hall of the enemy base, highest Town Hall first. */
export function breakdownByTargetTownHall(
  rows: AttackRow[]
): { townHall: number; summary: Summary }[] {
  const known = rows.filter(
    (row): row is AttackRow & { targetTownHall: number } =>
      row.targetTownHall !== null
  )
  return [...groupBy(known, (row) => row.targetTownHall)]
    .sort(([a], [b]) => b - a)
    .map(([townHall, group]) => ({ townHall, summary: summarize(group) }))
}

/**
 * Average of (enemy Town Hall - attacker Town Hall) over attacks where the enemy
 * level is known. Positive means this player tends to hit up.
 */
export function averageTownHallDiff(rows: AttackRow[]): number | null {
  const diffs = rows.flatMap((row) =>
    row.targetTownHall !== null && row.attackerTownHall > 0
      ? [row.targetTownHall - row.attackerTownHall]
      : []
  )
  return mean(diffs)
}

export interface ClanRecords {
  bestWar: { war: WarDTO; score: WarScore } | null
  fastestThreeStar: AttackRow | null
  bestPerformance: {
    playerId: string
    warId: string
    opponent: string
    stars: number
    destruction: number
  } | null
}

export function computeRecords(wars: WarDTO[]): ClanRecords {
  let bestWar: ClanRecords["bestWar"] = null
  let fastestThreeStar: AttackRow | null = null
  let bestPerformance: ClanRecords["bestPerformance"] = null

  for (const war of wars) {
    if (war.attacks.length === 0) continue
    const score = warScore(war)
    if (
      !bestWar ||
      score.stars > bestWar.score.stars ||
      (score.stars === bestWar.score.stars &&
        score.destruction > bestWar.score.destruction)
    ) {
      bestWar = { war, score }
    }
    const perPlayer = groupBy(war.attacks, (attack) => attack.playerId)
    for (const [playerId, attacks] of perPlayer) {
      const stars = sum(attacks.map((a) => a.stars))
      const destruction = sum(attacks.map((a) => a.destruction))
      if (
        !bestPerformance ||
        stars > bestPerformance.stars ||
        (stars === bestPerformance.stars &&
          destruction > bestPerformance.destruction)
      ) {
        bestPerformance = {
          playerId,
          warId: war.id,
          opponent: war.opponent,
          stars,
          destruction,
        }
      }
    }
  }

  for (const row of flattenAttacks(wars)) {
    if (
      row.stars === 3 &&
      row.durationSec !== null &&
      (!fastestThreeStar || row.durationSec < fastestThreeStar.durationSec!)
    ) {
      fastestThreeStar = row
    }
  }

  return { bestWar, fastestThreeStar, bestPerformance }
}

export function playersById(players: PlayerDTO[]) {
  return new Map(players.map((player) => [player.id, player]))
}
