import { describe, expect, it } from "vitest"

import { comparePlayerByType } from "./compare"
import type { WarType } from "./constants"
import { filterWars } from "./stats"
import type { AttackDTO, WarDTO } from "./types"

let counter = 0

function hit(
  playerId: string,
  stars: number,
  destruction: number,
  targetTownHall: number | null = 15
): AttackDTO {
  counter += 1
  return {
    id: `a${counter}`,
    playerId,
    order: 1,
    stars,
    destruction,
    durationSec: 120,
    attackedAt: "2026-01-01T12:00:00.000Z",
    targetPosition: counter,
    targetTownHall,
  }
}

function war(
  id: string,
  type: WarType,
  attacks: AttackDTO[],
  overrides: Partial<WarDTO> = {}
): WarDTO {
  return {
    id,
    type,
    opponent: `Clan ${id}`,
    size: 15,
    attacksPerMember: type === "cwl" ? 1 : 2,
    startedAt: "2026-01-01T00:00:00.000Z",
    status: "ended",
    roster: [{ playerId: "p1", townHall: 15 }],
    attacks,
    opponentStars: null,
    opponentDestruction: null,
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    seasonId: type === "cwl" ? "s1" : null,
    day: type === "cwl" ? 1 : null,
    ...overrides,
  }
}

describe("filterWars", () => {
  const wars = [
    war("r", "regular", []),
    war("c", "cwl", []),
    war("f", "friendly", []),
  ]

  it("'all' keeps every war", () => {
    expect(filterWars(wars, "all").map((w) => w.id)).toEqual(["r", "c", "f"])
  })

  it("'overall' is Regular plus CWL, never friendly", () => {
    expect(filterWars(wars, "overall").map((w) => w.id)).toEqual(["r", "c"])
  })

  it("a single type keeps only that type", () => {
    expect(filterWars(wars, "cwl").map((w) => w.id)).toEqual(["c"])
    expect(filterWars(wars, "friendly").map((w) => w.id)).toEqual(["f"])
  })
})

describe("comparePlayerByType", () => {
  const wars = [
    // Regular: two attacks, 3 stars at 100% and 1 star at 50%
    war("r", "regular", [hit("p1", 3, 100, 16), hit("p1", 1, 50, 15)]),
    // CWL: one attack, 2 stars at 70%, against a lower Town Hall
    war("c", "cwl", [hit("p1", 2, 70, 13)]),
    // Friendly practice: must stay out of Overall
    war("f", "friendly", [hit("p1", 3, 100, 12), hit("p1", 3, 100, 12)]),
  ]
  const byKey = (key: string) =>
    comparePlayerByType("p1", wars).find((c) => c.key === key)!

  it("returns Overall, Regular, CWL and Friendly in that order", () => {
    expect(comparePlayerByType("p1", wars).map((c) => c.key)).toEqual([
      "overall",
      "regular",
      "cwl",
      "friendly",
    ])
  })

  it("adds Regular and CWL counts together for Overall", () => {
    const overall = byKey("overall").stats
    const regular = byKey("regular").stats
    const cwl = byKey("cwl").stats
    expect(overall.wars).toBe(regular.wars + cwl.wars)
    expect(overall.attacks).toBe(regular.attacks + cwl.attacks)
    expect(overall.totalStars).toBe(regular.totalStars + cwl.totalStars)
    expect(overall.attacks).toBe(3)
    expect(overall.totalStars).toBe(6)
  })

  it("weights Overall averages by attacks, not by averaging the averages", () => {
    // Regular has 2 attacks averaging 75%, CWL has 1 at 70%. Weighting by attacks
    // gives 73.3%; averaging the two averages would wrongly give 72.5%.
    const overall = byKey("overall").stats
    expect(overall.avgDestruction).toBeCloseTo((100 + 50 + 70) / 3)
    expect(byKey("regular").stats.avgDestruction).toBe(75)
    expect(byKey("cwl").stats.avgDestruction).toBe(70)
  })

  it("keeps friendly wars out of Overall", () => {
    expect(byKey("overall").stats.attacks).toBe(3)
    expect(byKey("friendly").stats.attacks).toBe(2)
    expect(byKey("overall").stats.maxDestruction).toBe(100)
  })

  it("counts hit-ups across the two real war types", () => {
    const overall = byKey("overall").matchups
    // TH15 attacker: TH16 is up, TH15 same, TH13 down
    expect(overall).toMatchObject({
      hitUps: 1,
      hitUpStars: 3,
      sameTownHall: 1,
      hitDowns: 1,
    })
    expect(byKey("overall").avgTownHallDiff).toBeCloseTo((1 + 0 - 2) / 3)
  })

  it("gives empty stats, not NaN, for a type the player never fought", () => {
    const only = [war("r", "regular", [hit("p1", 2, 60)])]
    const cwl = comparePlayerByType("p1", only).find((c) => c.key === "cwl")!
    expect(cwl.stats.wars).toBe(0)
    expect(cwl.stats.attacks).toBe(0)
    expect(cwl.stats.avgStars).toBeNull()
    expect(cwl.avgTownHallDiff).toBeNull()
  })

  it("splits missed attacks per type for finished wars only", () => {
    const wars = [
      war("r", "regular", [hit("p1", 2, 60)]), // used 1 of 2 -> missed 1
      war("c", "cwl", [], { status: "ongoing" }), // still running, no penalty
    ]
    const columns = comparePlayerByType("p1", wars)
    expect(columns.find((c) => c.key === "regular")!.stats.missed).toBe(1)
    expect(columns.find((c) => c.key === "cwl")!.stats.missed).toBe(0)
    expect(columns.find((c) => c.key === "overall")!.stats.missed).toBe(1)
  })
})
