import { WAR_TYPE_META, type WarType } from "./constants"
import {
  averageTownHallDiff,
  computePlayerStats,
  filterWars,
  flattenAttacks,
  summarizeMatchups,
  type MatchupCounts,
  type PlayerStats,
} from "./stats"
import type { WarDTO } from "./types"

export type CompareKey = "overall" | WarType

export interface CompareColumn {
  key: CompareKey
  label: string
  stats: PlayerStats
  matchups: MatchupCounts
  /** Enemy Town Hall minus the player's own, averaged. Positive means they tend to hit up. */
  avgTownHallDiff: number | null
}

const COLUMNS: { key: CompareKey; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "regular", label: WAR_TYPE_META.regular.short },
  { key: "cwl", label: WAR_TYPE_META.cwl.short },
]

/**
 * One player's stats for Overall (Regular + CWL) next to each war type on its
 * own, so the two war types can be compared and added up at a glance.
 */
export function comparePlayerByType(
  playerId: string,
  wars: WarDTO[]
): CompareColumn[] {
  return COLUMNS.map(({ key, label }) => {
    const subset = filterWars(wars, key)
    const rows = flattenAttacks(subset).filter(
      (row) => row.playerId === playerId
    )
    return {
      key,
      label,
      stats: computePlayerStats([playerId], subset).get(playerId)!,
      matchups: summarizeMatchups(rows),
      avgTownHallDiff: averageTownHallDiff(rows),
    }
  })
}
