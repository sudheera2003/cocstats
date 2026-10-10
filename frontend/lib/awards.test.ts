import { describe, expect, it } from "vitest"

import {
  AWARD_WEIGHTS,
  computeAwards,
  defaultBonusSlots,
  regularMedalPercent,
} from "./awards"
import { lineup, WAR_DEFAULTS } from "./test-fixtures"
import type { AttackDTO, WarDTO } from "./types"

let counter = 0

/** An attack on enemy base number `position`; lower numbers are stronger bases. */
function hit(
  playerId: string,
  stars: number,
  position: number,
  destruction = stars === 3 ? 100 : stars * 30,
  targetTownHall = 13
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
    targetPosition: position,
    targetTownHall,
    targetName: null,
  }
}

// By Town Hall the lineup ranks p3 (TH16) #1, p1 (TH15) #2, p2 (TH14) #3.
const LINEUP = lineup([
  { playerId: "p1", townHall: 15 },
  { playerId: "p2", townHall: 14 },
  { playerId: "p3", townHall: 16 },
])

function day(n: number, overrides: Partial<WarDTO> = {}): WarDTO {
  return {
    id: `w${n}`,
    type: "cwl",
    opponent: `Clan ${n}`,
    size: 15,
    attacksPerMember: 1,
    startedAt: `2026-01-0${n}T00:00:00.000Z`,
    status: "ended",
    roster: LINEUP,
    attacks: [],
    opponentStars: null,
    opponentDestruction: null,
    ...WAR_DEFAULTS,
    seasonId: "s1",
    day: n,
    ...overrides,
  }
}

describe("computeAwards", () => {
  const wars = [
    day(1, {
      attacks: [
        hit("p1", 2, 1), // our #2 hits base #1: up 1 position
        hit("p2", 3, 10), // our #3 hits base #10: down
        hit("p3", 3, 1), // our #1 hits base #1: a mirror
      ],
    }),
  ]

  it("recognises hit-ups by map position and counts how far up they were", () => {
    const { ranked } = computeAwards(["p1", "p2", "p3"], wars)
    const p1 = ranked.find((r) => r.playerId === "p1")!
    expect(p1.metrics).toMatchObject({
      hitUps: 1,
      hitUpPositions: 1,
      hitUpStars: 2,
      hitDowns: 0,
    })
    const p2 = ranked.find((r) => r.playerId === "p2")!
    expect(p2.metrics).toMatchObject({
      hitUps: 0,
      hitDowns: 1,
      hitDownStars: 3,
    })
    const p3 = ranked.find((r) => r.playerId === "p3")!
    expect(p3.metrics.mirrors).toBe(1)
  })

  it("scores each factor with the published weights", () => {
    const { ranked } = computeAwards(["p1", "p2", "p3"], wars)
    const w = AWARD_WEIGHTS
    const byId = new Map(ranked.map((r) => [r.playerId, r]))

    // 2 stars, 1 attack, 1 hit-up of 1 position earning 2 stars
    expect(byId.get("p1")!.points).toBe(
      2 * w.star +
        w.attackUsed +
        w.hitUp +
        1 * w.hitUpPosition +
        2 * w.hitUpStar
    )
    // a triple on a lower-ranked base is discounted
    expect(byId.get("p2")!.points).toBe(
      3 * w.star + w.attackUsed + w.triple - 3 * w.hitDownStar
    )
    expect(byId.get("p3")!.points).toBe(3 * w.star + w.attackUsed + w.triple)
  })

  it("lists the breakdown lines so the total can be explained", () => {
    const { ranked } = computeAwards(["p1", "p2", "p3"], wars)
    for (const row of ranked) {
      expect(row.breakdown.reduce((sum, line) => sum + line.points, 0)).toBe(
        row.points
      )
    }
  })

  it("ranks the best contribution first", () => {
    const { ranked } = computeAwards(["p1", "p2", "p3"], wars)
    expect(ranked.map((r) => r.playerId)).toEqual(["p1", "p3", "p2"])
  })

  it("penalises missed attacks, but only in days that have ended", () => {
    const rosterIds = ["p1", "p2", "p3"]
    const attended = day(1, {
      attacks: [hit("p1", 2, 2), hit("p2", 2, 3), hit("p3", 2, 1)],
    })
    const missedDay = day(2, { attacks: [hit("p2", 2, 3), hit("p3", 2, 1)] })
    const stillRunning = day(3, { status: "ongoing", attacks: [] })

    const { ranked } = computeAwards(rosterIds, [
      attended,
      missedDay,
      stillRunning,
    ])
    const p1 = ranked.find((r) => r.playerId === "p1")!
    const p2 = ranked.find((r) => r.playerId === "p2")!
    expect(p1.metrics.missed).toBe(1)
    expect(p2.metrics.missed).toBe(0)
    expect(p1.points).toBeLessThan(p2.points)
    expect(p2.reasons).toContain("never missed an attack")
    expect(p1.reasons).not.toContain("never missed an attack")
  })

  it("leaves out players who never attacked", () => {
    const { ranked, noAttacks } = computeAwards(
      ["p1", "p2", "p3", "ghost"],
      wars
    )
    expect(ranked.map((r) => r.playerId)).not.toContain("ghost")
    expect(noAttacks).toEqual(["ghost"])
  })

  it("breaks a points tie in favour of more stars", () => {
    // Only stars (10 each) and hit-ups (10 each) count, so both score 20.
    const weights = {
      star: 10,
      attackUsed: 0,
      missedAttack: 0,
      hitUp: 10,
      hitUpPosition: 0,
      hitUpStar: 0,
      triple: 0,
      hitDownStar: 0,
    }
    // p1: 2 stars on a mirror base. p2: 1 star hitting up, but with
    // far higher destruction, so only the stars rule can put p1 first.
    const tie = [
      day(1, { attacks: [hit("p1", 2, 2, 40), hit("p2", 1, 1, 90)] }),
    ]
    // Listed p2 first so a pass-through of input order would fail.
    const { ranked } = computeAwards(["p2", "p1"], tie, weights)
    expect(ranked[0].points).toBe(20)
    expect(ranked[1].points).toBe(20)
    expect(ranked.map((r) => r.playerId)).toEqual(["p1", "p2"])
  })

  it("breaks a remaining tie in favour of fewer missed attacks", () => {
    const weights = {
      star: 10,
      attackUsed: 0,
      missedAttack: 0,
      hitUp: 0,
      hitUpPosition: 0,
      hitUpStar: 0,
      triple: 0,
      hitDownStar: 0,
    }
    // Same stars and points; p1 missed day 2, p2 didn't.
    const wars = [
      day(1, { attacks: [hit("p1", 1, 2), hit("p2", 1, 3)] }),
      day(2, { attacks: [hit("p2", 0, 3, 10)] }),
    ]
    const { ranked } = computeAwards(["p1", "p2"], wars, weights)
    expect(ranked[0].points).toBe(ranked[1].points)
    expect(ranked.map((r) => r.playerId)).toEqual(["p2", "p1"])
  })

  it("doesn't punish a top player for a weak enemy clan", () => {
    // Our #1 (TH18) against a clan whose best base is only TH13.
    const roster = lineup([
      { playerId: "top", townHall: 18 },
      { playerId: "mid", townHall: 15 },
      { playerId: "low", townHall: 13 },
    ])
    const wars = [
      day(1, {
        roster,
        attacks: [
          hit("top", 3, 1, 100, 13), // mirror on their best base
          hit("mid", 3, 2, 100, 12), // mirror
          hit("low", 3, 3, 100, 11), // mirror
        ],
      }),
    ]
    const { ranked } = computeAwards(["top", "mid", "low"], wars)
    const w = AWARD_WEIGHTS
    for (const row of ranked) {
      expect(row.metrics.mirrors).toBe(1)
      expect(row.metrics.hitDownStars).toBe(0)
      expect(row.points).toBe(3 * w.star + w.attackUsed + w.triple)
    }
  })

  it("still discounts a top player who attacks a base ranked far below", () => {
    const roster = lineup([
      { playerId: "top", townHall: 18 },
      { playerId: "low", townHall: 13 },
    ])
    const wars = [
      day(1, {
        roster,
        attacks: [hit("top", 3, 9, 100, 10), hit("low", 3, 2)],
      }),
    ]
    const { ranked } = computeAwards(["top", "low"], wars)
    const top = ranked.find((r) => r.playerId === "top")!
    expect(top.metrics.hitDowns).toBe(1)
    expect(top.metrics.hitDownStars).toBe(3)
  })

  it("tells players with the same Town Hall apart by map position", () => {
    // Two TH16s hold #1 and #2, and each hits the base level with their own spot.
    const roster = lineup([
      { playerId: "a", townHall: 16 },
      { playerId: "b", townHall: 16 },
      { playerId: "c", townHall: 14 },
    ])
    const wars = [
      day(1, {
        roster,
        attacks: [hit("a", 2, 1), hit("b", 2, 2), hit("c", 2, 1)],
      }),
    ]
    const { ranked } = computeAwards(["a", "b", "c"], wars)
    const byId = new Map(ranked.map((r) => [r.playerId, r]))
    expect(byId.get("a")!.metrics.mirrors).toBe(1)
    expect(byId.get("b")!.metrics.mirrors).toBe(1)
    // the TH14 is #3, so base #1 is two positions up
    expect(byId.get("c")!.metrics).toMatchObject({
      hitUps: 1,
      hitUpPositions: 2,
    })
  })
})

describe("regularMedalPercent", () => {
  it("gives 20% for being on the roster plus 10% per star, capped at 8 stars", () => {
    expect(regularMedalPercent(0)).toBe(20)
    expect(regularMedalPercent(3)).toBe(50)
    expect(regularMedalPercent(8)).toBe(100)
    expect(regularMedalPercent(14)).toBe(100)
  })
})

describe("defaultBonusSlots", () => {
  it("is one per war won", () => {
    expect(defaultBonusSlots(0)).toBe(0)
    expect(defaultBonusSlots(4)).toBe(4)
    expect(defaultBonusSlots(-1)).toBe(0)
  })
})
