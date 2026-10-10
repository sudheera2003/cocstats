import { describe, expect, it } from "vitest"

import { CWL_DAYS, CWL_WIN_BONUS_STARS } from "./constants"
import { computeSeasonPlayers, computeSeasonStandings } from "./cwl"
import { lineup, WAR_DEFAULTS } from "./test-fixtures"
import type { AttackDTO, WarDTO } from "./types"

let counter = 0

function hit(
  playerId: string,
  targetPosition: number,
  stars: number,
  destruction: number
): AttackDTO {
  counter += 1
  return {
    id: `a${counter}`,
    playerId,
    order: 1,
    stars,
    destruction,
    durationSec: 150,
    sequence: counter,
    targetPosition,
    targetTownHall: 15,
    targetName: null,
  }
}

function day(n: number, overrides: Partial<WarDTO> = {}): WarDTO {
  return {
    id: `w${n}`,
    type: "cwl",
    opponent: `Clan ${n}`,
    size: 5,
    attacksPerMember: 1,
    startedAt: `2026-01-0${n}T00:00:00.000Z`,
    status: "ended",
    roster: lineup([
      { playerId: "p1", townHall: 15 },
      { playerId: "p2", townHall: 14 },
    ]),
    attacks: [],
    opponentStars: null,
    opponentDestruction: null,
    ...WAR_DEFAULTS,
    seasonId: "s1",
    day: n,
    ...overrides,
  }
}

describe("computeSeasonStandings", () => {
  it("always returns seven days, with gaps for days not started", () => {
    const standings = computeSeasonStandings([day(2)])
    expect(standings.days).toHaveLength(CWL_DAYS)
    expect(standings.days.map((d) => d.war?.id ?? null)).toEqual([
      null,
      "w2",
      null,
      null,
      null,
      null,
      null,
    ])
    expect(standings.played).toBe(1)
  })

  it("adds the win bonus on top of war stars", () => {
    const won = day(1, {
      attacks: [hit("p1", 1, 3, 100), hit("p2", 2, 2, 60)],
      opponentStars: 2,
      opponentDestruction: 30,
    })
    const lost = day(2, {
      attacks: [hit("p1", 1, 1, 50)],
      opponentStars: 9,
      opponentDestruction: 90,
    })
    const standings = computeSeasonStandings([won, lost])
    expect(standings.wins).toBe(1)
    expect(standings.losses).toBe(1)
    expect(standings.warStars).toBe(6) // 5 + 1
    expect(standings.bonusStars).toBe(CWL_WIN_BONUS_STARS)
    expect(standings.totalStars).toBe(6 + CWL_WIN_BONUS_STARS)
  })

  it("sums each day's destruction for the tiebreaker", () => {
    // size 5: day 1 = (100 + 60) / 5 = 32%, day 2 = 50 / 5 = 10%
    const standings = computeSeasonStandings([
      day(1, { attacks: [hit("p1", 1, 3, 100), hit("p2", 2, 2, 60)] }),
      day(2, { attacks: [hit("p1", 1, 1, 50)] }),
    ])
    expect(standings.totalDestruction).toBeCloseTo(42)
  })

  it("doesn't award a bonus until a day has ended with a recorded result", () => {
    const standings = computeSeasonStandings([
      day(1, {
        status: "ongoing",
        attacks: [hit("p1", 1, 3, 100)],
        opponentStars: 0,
        opponentDestruction: 0,
      }),
      day(2, { attacks: [hit("p1", 1, 3, 100)] }), // ended, no result entered
    ])
    expect(standings.wins).toBe(0)
    expect(standings.bonusStars).toBe(0)
    expect(standings.totalStars).toBe(6)
  })

  it("counts missed attacks only in finished days", () => {
    const standings = computeSeasonStandings([
      day(1, { attacks: [hit("p1", 1, 2, 60)] }), // p2 missed
      day(2, { status: "ongoing", attacks: [] }), // nobody has attacked yet
    ])
    expect(standings.missed).toBe(1)
  })
})

describe("computeSeasonPlayers", () => {
  it("separates days in the lineup from days on the bench", () => {
    const wars = [
      day(1, { attacks: [hit("p1", 1, 3, 100)] }),
      day(2, {
        roster: lineup([{ playerId: "p1", townHall: 15 }]),
        attacks: [hit("p1", 2, 2, 70)],
      }),
    ]
    const rows = computeSeasonPlayers(["p1", "p2", "p3"], wars)
    const byId = new Map(rows.map((r) => [r.playerId, r]))

    expect(byId.get("p1")).toMatchObject({ daysInLineup: 2, daysBenched: 0 })
    expect(byId.get("p2")).toMatchObject({ daysInLineup: 1, daysBenched: 1 })
    expect(byId.get("p3")).toMatchObject({ daysInLineup: 0, daysBenched: 2 })
    expect(byId.get("p1")!.stats.totalStars).toBe(5)
    expect(byId.get("p2")!.stats.missed).toBe(1)
  })
})
