import { describe, expect, it } from "vitest"

import {
  AWARD_WEIGHTS,
  computeAwards,
  defaultBonusSlots,
  regularMedalPercent,
} from "./awards"
import type { AttackDTO, WarDTO } from "./types"

let counter = 0

function hit(
  playerId: string,
  stars: number,
  targetTownHall: number | null,
  destruction = stars === 3 ? 100 : stars * 30
): AttackDTO {
  counter += 1
  return {
    id: `a${counter}`,
    playerId,
    order: 1,
    stars,
    destruction,
    durationSec: 150,
    attackedAt: "2026-01-01T12:00:00.000Z",
    targetPosition: counter,
    targetTownHall,
  }
}

const LINEUP = [
  { playerId: "p1", townHall: 15 },
  { playerId: "p2", townHall: 14 },
  { playerId: "p3", townHall: 16 },
]

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
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    seasonId: "s1",
    day: n,
    ...overrides,
  }
}

describe("computeAwards", () => {
  const wars = [
    day(1, {
      attacks: [
        hit("p1", 2, 17), // TH15 hits TH17: up 2 levels
        hit("p2", 3, 12), // TH14 hits TH12: down 2 levels
        hit("p3", 3, 16), // TH16 hits TH16: same
      ],
    }),
  ]

  it("recognises hit-ups and counts how far up they were", () => {
    const { ranked } = computeAwards(["p1", "p2", "p3"], wars)
    const p1 = ranked.find((r) => r.playerId === "p1")!
    expect(p1.metrics).toMatchObject({
      hitUps: 1,
      hitUpLevels: 2,
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
    expect(p3.metrics.sameTownHall).toBe(1)
  })

  it("scores each factor with the published weights", () => {
    const { ranked } = computeAwards(["p1", "p2", "p3"], wars)
    const w = AWARD_WEIGHTS
    const byId = new Map(ranked.map((r) => [r.playerId, r]))

    // 2 stars, 1 attack, 1 hit-up of 2 levels earning 2 stars
    expect(byId.get("p1")!.points).toBe(
      2 * w.star + w.attackUsed + w.hitUp + 2 * w.hitUpLevel + 2 * w.hitUpStar
    )
    // a triple against a lower Town Hall is discounted
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
      attacks: [hit("p1", 2, 15), hit("p2", 2, 14), hit("p3", 2, 16)],
    })
    const missedDay = day(2, { attacks: [hit("p2", 2, 14), hit("p3", 2, 16)] })
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
      hitUpLevel: 0,
      hitUpStar: 0,
      triple: 0,
      hitDownStar: 0,
    }
    // p1: 2 stars hitting the same Town Hall. p2: 1 star hitting up, but with
    // far higher destruction, so only the stars rule can put p1 first.
    const tie = [
      day(1, { attacks: [hit("p1", 2, 15, 40), hit("p2", 1, 15, 90)] }),
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
      hitUpLevel: 0,
      hitUpStar: 0,
      triple: 0,
      hitDownStar: 0,
    }
    // Same stars and points; p1 missed day 2, p2 didn't.
    const wars = [
      day(1, { attacks: [hit("p1", 1, 15), hit("p2", 1, 14)] }),
      day(2, { attacks: [hit("p2", 0, 14, 10)] }),
    ]
    const { ranked } = computeAwards(["p1", "p2"], wars, weights)
    expect(ranked[0].points).toBe(ranked[1].points)
    expect(ranked.map((r) => r.playerId)).toEqual(["p2", "p1"])
  })

  it("ignores attacks where the enemy Town Hall wasn't recorded", () => {
    const { ranked } = computeAwards(
      ["p1"],
      [day(1, { attacks: [hit("p1", 3, null)] })]
    )
    expect(ranked[0].metrics).toMatchObject({
      hitUps: 0,
      hitDowns: 0,
      sameTownHall: 0,
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
