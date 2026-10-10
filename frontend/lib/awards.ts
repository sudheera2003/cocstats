import {
  computePlayerStats,
  flattenAttacks,
  groupBy,
  summarizeMatchups,
} from "./stats"
import type { WarDTO } from "./types"

/**
 * How much each thing is worth when deciding who deserves a CWL bonus medal.
 * Everything is in plain points so a leader can see exactly why someone ranks
 * where they do. Change a number here to change what the clan rewards.
 */
export const AWARD_WEIGHTS = {
  /** Every star earned. */
  star: 10,
  /** Every attack made: showing up matters. */
  attackUsed: 3,
  /** Every attack left unused in a finished day. Subtracted. */
  missedAttack: 10,
  /** Every attack on a base ranked above the attacker's own, whatever the result. */
  hitUp: 5,
  /** Each map position above the attacker's rank, per hit-up. */
  hitUpPosition: 1,
  /** Extra for every star earned while hitting up. */
  hitUpStar: 5,
  /** Extra for a 3-star attack. */
  triple: 5,
  /** Subtracted for every star earned on a base ranked below the attacker's own, which is easier. */
  hitDownStar: 2,
} as const

export type AwardWeights = { [K in keyof typeof AWARD_WEIGHTS]: number }

export interface AwardMetrics {
  stars: number
  attacksUsed: number
  daysInLineup: number
  missed: number
  threeStars: number
  avgDestruction: number | null
  hitUps: number
  /** Stars earned on attacks against a higher-ranked base. */
  hitUpStars: number
  /** Triples earned against a higher-ranked base. */
  hitUpThreeStars: number
  /** Sum of how many map positions above the attacker each hit-up was. */
  hitUpPositions: number
  /** Attacks on the base matching the attacker's own rank. */
  mirrors: number
  hitDowns: number
  hitDownStars: number
}

export interface AwardLine {
  key: keyof AwardWeights
  label: string
  /** How many of the thing, e.g. 8 stars. */
  count: number
  /** Points it contributed, negative for penalties. */
  points: number
}

export interface AwardRow {
  playerId: string
  points: number
  metrics: AwardMetrics
  breakdown: AwardLine[]
  /** Short human reasons to justify the placement. */
  reasons: string[]
  /** Share of the regular medals they earned for their stars (20% + 10% per star, 100% at 8). */
  regularMedalPercent: number
}

export interface AwardResult {
  /** Players who attacked at least once, best first. */
  ranked: AwardRow[]
  /** Registered players who never attacked and so can't be ranked. */
  noAttacks: string[]
}

/** The game's regular medal share for a player: 20% for the roster, 10% per star, capped at 100%. */
export function regularMedalPercent(stars: number) {
  return Math.min(100, 20 + 10 * stars)
}

/** Each war the clan wins unlocks one bonus allocation. */
export function defaultBonusSlots(wins: number) {
  return Math.max(0, wins)
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

function describe(metrics: AwardMetrics) {
  const reasons = [
    `${metrics.stars}★ from ${plural(metrics.attacksUsed, "attack")}`,
  ]
  if (metrics.hitUps > 0) {
    reasons.push(
      `${plural(metrics.hitUps, "hit-up")}, ${metrics.hitUpStars}★ earned on them`
    )
  }
  if (metrics.threeStars > 0) {
    reasons.push(plural(metrics.threeStars, "triple"))
  }
  if (metrics.missed === 0 && metrics.daysInLineup > 1) {
    reasons.push("never missed an attack")
  }
  return reasons
}

function pointsFor(metrics: AwardMetrics, weights: AwardWeights): AwardLine[] {
  return [
    {
      key: "star",
      label: "Stars",
      count: metrics.stars,
      points: metrics.stars * weights.star,
    },
    {
      key: "attackUsed",
      label: "Attacks used",
      count: metrics.attacksUsed,
      points: metrics.attacksUsed * weights.attackUsed,
    },
    {
      key: "hitUp",
      label: "Hit-ups",
      count: metrics.hitUps,
      points: metrics.hitUps * weights.hitUp,
    },
    {
      key: "hitUpPosition",
      label: "Positions hit above",
      count: metrics.hitUpPositions,
      points: metrics.hitUpPositions * weights.hitUpPosition,
    },
    {
      key: "hitUpStar",
      label: "Stars on hit-ups",
      count: metrics.hitUpStars,
      points: metrics.hitUpStars * weights.hitUpStar,
    },
    {
      key: "triple",
      label: "Triples",
      count: metrics.threeStars,
      points: metrics.threeStars * weights.triple,
    },
    {
      key: "hitDownStar",
      label: "Stars on lower bases",
      count: metrics.hitDownStars,
      points: -metrics.hitDownStars * weights.hitDownStar,
    },
    {
      key: "missedAttack",
      label: "Missed attacks",
      count: metrics.missed,
      points: -metrics.missed * weights.missedAttack,
    },
  ]
}

/**
 * Ranks a season's players by who has contributed the most, for deciding who
 * gets the bonus medals. Only players who attacked can be ranked.
 */
export function computeAwards(
  rosterIds: string[],
  wars: WarDTO[],
  weights: AwardWeights = AWARD_WEIGHTS
): AwardResult {
  const stats = computePlayerStats(rosterIds, wars)
  const rowsByPlayer = groupBy(flattenAttacks(wars), (row) => row.playerId)

  const ranked: AwardRow[] = []
  const noAttacks: string[] = []

  for (const playerId of rosterIds) {
    const playerStats = stats.get(playerId)!
    const attacks = rowsByPlayer.get(playerId) ?? []
    if (attacks.length === 0) {
      noAttacks.push(playerId)
      continue
    }

    const metrics: AwardMetrics = {
      stars: playerStats.totalStars,
      attacksUsed: attacks.length,
      daysInLineup: playerStats.wars,
      missed: playerStats.missed,
      threeStars: playerStats.threeStars,
      avgDestruction: playerStats.avgDestruction,
      ...summarizeMatchups(attacks),
    }

    const breakdown = pointsFor(metrics, weights)
    ranked.push({
      playerId,
      points: breakdown.reduce((sum, line) => sum + line.points, 0),
      metrics,
      breakdown,
      reasons: describe(metrics),
      regularMedalPercent: regularMedalPercent(metrics.stars),
    })
  }

  ranked.sort(
    (a, b) =>
      b.points - a.points ||
      b.metrics.stars - a.metrics.stars ||
      a.metrics.missed - b.metrics.missed ||
      (b.metrics.avgDestruction ?? 0) - (a.metrics.avgDestruction ?? 0) ||
      a.playerId.localeCompare(b.playerId)
  )
  return { ranked, noAttacks }
}
