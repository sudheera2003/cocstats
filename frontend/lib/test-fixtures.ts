import type { RosterEntryDTO, WarDTO } from "./types"

/**
 * A lineup for tests. Map positions follow Town Hall, strongest first, with
 * ties in the order given.
 */
export function lineup(
  entries: { playerId: string; townHall: number }[]
): RosterEntryDTO[] {
  const ranked = [...entries].sort((a, b) => b.townHall - a.townHall)
  return entries.map((entry) => ({
    ...entry,
    name: entry.playerId,
    position: ranked.indexOf(entry) + 1,
  }))
}

/** The parts of a war that no stat depends on. */
export const WAR_DEFAULTS = {
  opponentTag: "#2PP",
  opponentBadge: null,
  phase: "ended",
  preparationStartedAt: "2025-12-31T00:00:00.000Z",
  endsAt: "2026-01-02T00:00:00.000Z",
  enemyBases: [],
} satisfies Partial<WarDTO>
