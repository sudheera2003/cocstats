import { describe, expect, it } from "vitest"

import {
  attackerRankRange,
  averageTownHallDiff,
  breakdownByMatchup,
  breakdownByTargetTownHall,
  computeClanStats,
  computePlayerStats,
  flattenAttacks,
  rankMatchup,
  summarize,
  warOutcome,
  warScore,
} from "./stats"
import { lineup, WAR_DEFAULTS } from "./test-fixtures"
import type { AttackDTO, WarDTO } from "./types"

let nextAttack = 0

function attack(
  overrides: Partial<AttackDTO> & Pick<AttackDTO, "playerId">
): AttackDTO {
  nextAttack += 1
  return {
    id: `a${nextAttack}`,
    order: 1,
    stars: 2,
    destruction: 70,
    durationSec: 150,
    sequence: nextAttack,
    targetPosition: nextAttack,
    targetTownHall: null,
    targetName: null,
    ...overrides,
  }
}

function war(overrides: Partial<WarDTO> = {}): WarDTO {
  return {
    id: "w1",
    type: "regular",
    opponent: "Rivals",
    size: 5,
    attacksPerMember: 2,
    startedAt: "2026-01-01T00:00:00.000Z",
    status: "ended",
    roster: lineup([
      { playerId: "p1", townHall: 15 },
      { playerId: "p2", townHall: 14 },
    ]),
    attacks: [],
    opponentStars: null,
    opponentDestruction: null,
    ...WAR_DEFAULTS,
    seasonId: null,
    day: null,
    ...overrides,
  }
}

describe("summarize", () => {
  it("returns empty values instead of NaN when there are no attacks", () => {
    const s = summarize([])
    expect(s.attacks).toBe(0)
    expect(s.avgStars).toBeNull()
    expect(s.maxDestruction).toBeNull()
    expect(s.threeStarRate).toBeNull()
    expect(s.avgDuration).toBeNull()
    expect(s.distribution).toEqual([0, 0, 0, 0])
  })

  it("computes averages, extremes and the star distribution", () => {
    const rows = flattenAttacks([
      war({
        attacks: [
          attack({
            playerId: "p1",
            stars: 3,
            destruction: 100,
            durationSec: 100,
          }),
          attack({
            playerId: "p1",
            stars: 2,
            destruction: 60,
            durationSec: 170,
          }),
          attack({
            playerId: "p2",
            stars: 0,
            destruction: 20,
            durationSec: null,
          }),
          attack({
            playerId: "p2",
            stars: 1,
            destruction: 40,
            durationSec: 130,
          }),
        ],
      }),
    ])
    const s = summarize(rows)
    expect(s.totalStars).toBe(6)
    expect(s.avgStars).toBe(1.5)
    expect(s.maxStars).toBe(3)
    expect(s.minStars).toBe(0)
    expect(s.avgDestruction).toBe(55)
    expect(s.maxDestruction).toBe(100)
    expect(s.minDestruction).toBe(20)
    expect(s.distribution).toEqual([1, 1, 1, 1])
    expect(s.threeStarRate).toBe(0.25)
  })

  it("ignores attacks without a recorded duration when averaging time", () => {
    const rows = flattenAttacks([
      war({
        attacks: [
          attack({
            playerId: "p1",
            stars: 3,
            destruction: 100,
            durationSec: 100,
          }),
          attack({
            playerId: "p2",
            stars: 1,
            destruction: 50,
            durationSec: 160,
          }),
          attack({
            playerId: "p2",
            stars: 2,
            destruction: 80,
            durationSec: null,
          }),
        ],
      }),
    ])
    const s = summarize(rows)
    expect(s.avgDuration).toBe(130)
    expect(s.minDuration).toBe(100)
    expect(s.maxDuration).toBe(160)
    expect(s.fastestThreeStar).toBe(100)
  })
})

describe("warScore", () => {
  it("counts only the best result on each enemy base", () => {
    const score = warScore(
      war({
        attacks: [
          attack({
            playerId: "p1",
            targetPosition: 1,
            stars: 1,
            destruction: 50,
          }),
          attack({
            playerId: "p2",
            targetPosition: 1,
            stars: 3,
            destruction: 100,
          }),
          attack({
            playerId: "p1",
            targetPosition: 2,
            stars: 2,
            destruction: 80,
          }),
        ],
      })
    )
    expect(score.stars).toBe(5)
    expect(score.basesHit).toBe(2)
    expect(score.basesThreeStarred).toBe(1)
    expect(score.attacksUsed).toBe(3)
    expect(score.attacksAvailable).toBe(4)
  })

  it("averages destruction over every enemy base, attacked or not", () => {
    // 100% + 50% across a 5 base war = 30%
    const score = warScore(
      war({
        attacks: [
          attack({
            playerId: "p1",
            targetPosition: 1,
            stars: 3,
            destruction: 100,
          }),
          attack({
            playerId: "p2",
            targetPosition: 2,
            stars: 1,
            destruction: 50,
          }),
        ],
      })
    )
    expect(score.destruction).toBeCloseTo(30)
  })
})

describe("warOutcome", () => {
  const hit = (stars: number, destruction: number, targetPosition: number) =>
    attack({ playerId: "p1", stars, destruction, targetPosition })

  it("is ongoing until the war is ended", () => {
    expect(warOutcome(war({ status: "ongoing" }))).toBe("ongoing")
  })

  it("is unrecorded when the opponent's result is missing", () => {
    expect(warOutcome(war({ attacks: [hit(3, 100, 1)] }))).toBe("unrecorded")
  })

  it("decides on stars first", () => {
    const attacks = [hit(3, 100, 1), hit(2, 60, 2)]
    expect(
      warOutcome(war({ attacks, opponentStars: 4, opponentDestruction: 99 }))
    ).toBe("win")
    expect(
      warOutcome(war({ attacks, opponentStars: 6, opponentDestruction: 1 }))
    ).toBe("loss")
  })

  it("falls back to destruction when stars are level", () => {
    // 5 stars, (100 + 60) / 5 = 32%
    const attacks = [hit(3, 100, 1), hit(2, 60, 2)]
    expect(
      warOutcome(war({ attacks, opponentStars: 5, opponentDestruction: 31 }))
    ).toBe("win")
    expect(
      warOutcome(war({ attacks, opponentStars: 5, opponentDestruction: 33 }))
    ).toBe("loss")
    expect(
      warOutcome(war({ attacks, opponentStars: 5, opponentDestruction: 32 }))
    ).toBe("tie")
  })
})

describe("computePlayerStats", () => {
  it("only counts missed attacks in wars that have ended", () => {
    const ended = war({
      id: "ended",
      attacks: [attack({ playerId: "p1" })],
    })
    const ongoing = war({ id: "ongoing", status: "ongoing", attacks: [] })
    const stats = computePlayerStats(["p1", "p2"], [ended, ongoing])

    const p1 = stats.get("p1")!
    expect(p1.wars).toBe(2)
    expect(p1.attacks).toBe(1)
    expect(p1.missed).toBe(1) // used 1 of 2 in the ended war, ongoing war ignored
    expect(p1.usageRate).toBe(0.5)

    const p2 = stats.get("p2")!
    expect(p2.missed).toBe(2)
    expect(p2.usageRate).toBe(0)
    expect(p2.avgStars).toBeNull()
  })

  it("leaves players who were never rostered with empty stats", () => {
    const stats = computePlayerStats(["ghost"], [war()])
    const ghost = stats.get("ghost")!
    expect(ghost.wars).toBe(0)
    expect(ghost.missed).toBe(0)
    expect(ghost.usageRate).toBeNull()
    expect(ghost.starsPerWar).toBeNull()
  })

  it("reports stars per war across every war they were in", () => {
    const w1 = war({
      id: "w1",
      attacks: [attack({ playerId: "p1", stars: 3, destruction: 100 })],
    })
    const w2 = war({
      id: "w2",
      attacks: [attack({ playerId: "p1", stars: 1, destruction: 50 })],
    })
    expect(computePlayerStats(["p1"], [w1, w2]).get("p1")!.starsPerWar).toBe(2)
  })
})

describe("computeClanStats", () => {
  it("tallies results and ignores unrecorded wars in the win rate", () => {
    const win = war({
      id: "win",
      attacks: [attack({ playerId: "p1", stars: 3, destruction: 100 })],
      opponentStars: 1,
      opponentDestruction: 10,
    })
    const loss = war({
      id: "loss",
      attacks: [attack({ playerId: "p1", stars: 1, destruction: 50 })],
      opponentStars: 9,
      opponentDestruction: 90,
    })
    const unrecorded = war({ id: "unrecorded", attacks: [] })
    const stats = computeClanStats([win, loss, unrecorded])
    expect(stats.wins).toBe(1)
    expect(stats.losses).toBe(1)
    expect(stats.winRate).toBe(0.5)
    expect(stats.endedWars).toBe(3)
  })

  it("orders the trend oldest first and flags unfinished wars", () => {
    const newer = war({ id: "newer", startedAt: "2026-02-01T00:00:00.000Z" })
    const older = war({ id: "older", startedAt: "2026-01-01T00:00:00.000Z" })
    const live = war({
      id: "live",
      status: "ongoing",
      startedAt: "2026-03-01T00:00:00.000Z",
    })
    const trend = computeClanStats([live, newer, older]).trend
    expect(trend.map((p) => p.warId)).toEqual(["older", "newer", "live"])
    expect(trend.map((p) => p.status)).toEqual(["ended", "ended", "ongoing"])
  })
})

describe("attackerRankRange", () => {
  const roster = lineup([
    { playerId: "a", townHall: 18 },
    { playerId: "b", townHall: 16 },
    { playerId: "c", townHall: 16 },
    { playerId: "d", townHall: 13 },
  ])

  it("is the player's map position in the lineup", () => {
    expect(attackerRankRange(roster, "a")).toEqual({ low: 1, high: 1 })
    expect(attackerRankRange(roster, "d")).toEqual({ low: 4, high: 4 })
  })

  it("tells equal Town Halls apart by their position", () => {
    expect(attackerRankRange(roster, "b")).toEqual({ low: 2, high: 2 })
    expect(attackerRankRange(roster, "c")).toEqual({ low: 3, high: 3 })
  })

  it("spans the whole lineup for someone who isn't in it", () => {
    expect(attackerRankRange(roster, "z")).toEqual({ low: 1, high: 4 })
  })
})

describe("rankMatchup", () => {
  const range = { low: 3, high: 4 }

  it("is a mirror anywhere inside the range", () => {
    expect(rankMatchup(range, 3)).toEqual({ direction: "same", positions: 0 })
    expect(rankMatchup(range, 4)).toEqual({ direction: "same", positions: 0 })
  })

  it("counts positions above and below the range", () => {
    expect(rankMatchup(range, 1)).toEqual({ direction: "up", positions: 2 })
    expect(rankMatchup(range, 9)).toEqual({ direction: "down", positions: 5 })
  })

  it("makes the top player's attack on the enemy #1 a mirror, whatever the Town Halls", () => {
    const top = attackerRankRange(
      lineup([
        { playerId: "th18", townHall: 18 },
        { playerId: "th15", townHall: 15 },
      ]),
      "th18"
    )
    expect(rankMatchup(top, 1).direction).toBe("same")
  })
})

describe("breakdownByMatchup", () => {
  it("splits attacks by map position against the attacker's own rank", () => {
    // war() lineup: p1 (TH15) is #1, p2 (TH14) is #2
    const rows = flattenAttacks([
      war({
        attacks: [
          attack({ playerId: "p1", targetPosition: 1 }), // mirror
          attack({ playerId: "p2", targetPosition: 1 }), // hitting up
          attack({ playerId: "p2", targetPosition: 5 }), // hitting down
          attack({ playerId: "p1", targetPosition: 9, targetTownHall: null }), // down, TH not needed
        ],
      }),
    ])
    const result = breakdownByMatchup(rows)
    expect(result.get("same")!.attacks).toBe(1)
    expect(result.get("up")!.attacks).toBe(1)
    expect(result.get("down")!.attacks).toBe(2)
  })
})

describe("breakdownByTargetTownHall", () => {
  it("groups attacks by enemy Town Hall, highest first, skipping unknowns", () => {
    const rows = flattenAttacks([
      war({
        attacks: [
          attack({ playerId: "p1", stars: 3, targetTownHall: 16 }),
          attack({ playerId: "p1", stars: 1, targetTownHall: 14 }),
          attack({ playerId: "p2", stars: 2, targetTownHall: 16 }),
          attack({ playerId: "p2", stars: 0, targetTownHall: null }),
        ],
      }),
    ])
    const result = breakdownByTargetTownHall(rows)
    expect(result.map((r) => r.townHall)).toEqual([16, 14])
    expect(result[0].summary.attacks).toBe(2)
    expect(result[0].summary.avgStars).toBe(2.5)
    expect(result[1].summary.avgStars).toBe(1)
  })
})

describe("averageTownHallDiff", () => {
  it("is positive when a player tends to hit up", () => {
    const rows = flattenAttacks([
      war({
        attacks: [
          attack({ playerId: "p1", targetTownHall: 16 }), // TH15 attacker: +1
          attack({ playerId: "p1", targetTownHall: 17 }), // +2
          attack({ playerId: "p2", targetTownHall: 13 }), // TH14 attacker: -1
        ],
      }),
    ])
    expect(averageTownHallDiff(rows)).toBeCloseTo(2 / 3)
  })

  it("is null when no enemy Town Hall is known", () => {
    expect(
      averageTownHallDiff(
        flattenAttacks([war({ attacks: [attack({ playerId: "p1" })] })])
      )
    ).toBeNull()
  })
})
