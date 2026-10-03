import { describe, expect, it } from "vitest"

import {
  addAttackSchema,
  attackConsistencyIssue,
  attackWindowIssue,
  createCwlDaySchema,
  createSeasonSchema,
  createWarSchema,
  normalizeTag,
  playerSchema,
  updateSeasonSchema,
} from "./validation"

const ID = "6abf76a83993adfbe8866985"
const OTHER_ID = "6abf768557655b5559fd9dce"

describe("attackConsistencyIssue", () => {
  it.each([
    [0, 0],
    [0, 49],
    [1, 20],
    [1, 49],
    [1, 50],
    [1, 99],
    [2, 50],
    [2, 99],
    [3, 100],
  ])("allows %i stars at %i%%", (stars, destruction) => {
    expect(attackConsistencyIssue(stars, destruction)).toBeNull()
  })

  it.each([
    [2, 100],
    [1, 100],
    [0, 100],
    [3, 99],
    [3, 50],
    [0, 50],
    [0, 75],
    [2, 49],
    [2, 10],
  ])("rejects %i stars at %i%%", (stars, destruction) => {
    expect(attackConsistencyIssue(stars, destruction)).toEqual(
      expect.any(String)
    )
  })
})

describe("normalizeTag", () => {
  it("uppercases, swaps O for zero and adds the hash", () => {
    expect(normalizeTag("2pp0jccl")).toBe("#2PP0JCCL")
    expect(normalizeTag("  #2ppOjccl ")).toBe("#2PP0JCCL")
  })

  it("leaves an empty tag empty", () => {
    expect(normalizeTag("   ")).toBe("")
  })
})

describe("playerSchema", () => {
  const valid = { name: "Archer Queen", tag: "", townHall: 15, role: "member" }

  it("accepts a player without a tag", () => {
    expect(playerSchema.safeParse(valid).success).toBe(true)
  })

  it("normalises the tag it accepts", () => {
    const result = playerSchema.parse({ ...valid, tag: "2pp0jccl" })
    expect(result.tag).toBe("#2PP0JCCL")
  })

  it("rejects characters that can't appear in a real tag", () => {
    expect(playerSchema.safeParse({ ...valid, tag: "#ABCDEFG" }).success).toBe(
      false
    )
  })

  it("requires a name and a sensible town hall", () => {
    expect(playerSchema.safeParse({ ...valid, name: "   " }).success).toBe(
      false
    )
    expect(playerSchema.safeParse({ ...valid, townHall: 0 }).success).toBe(
      false
    )
    expect(playerSchema.safeParse({ ...valid, townHall: 99 }).success).toBe(
      false
    )
  })
})

describe("createWarSchema", () => {
  const valid = {
    opponent: "Rivals",
    type: "regular",
    size: 15,
    attacksPerMember: 2,
    notes: "",
    startedAt: null,
    playerIds: [ID, OTHER_ID],
  }

  it("accepts a normal war", () => {
    expect(createWarSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects a size that doesn't exist for the war type", () => {
    const result = createWarSchema.safeParse({
      ...valid,
      type: "friendly",
      size: 12,
    })
    expect(result.success).toBe(false)
  })

  it("doesn't allow CWL wars to be created one by one", () => {
    expect(createWarSchema.safeParse({ ...valid, type: "cwl" }).success).toBe(
      false
    )
  })

  it("rejects a roster bigger than the war", () => {
    const result = createWarSchema.safeParse({
      ...valid,
      type: "regular",
      size: 5,
      playerIds: Array.from(
        { length: 6 },
        (_, i) => `6abf76a83993adfbe88669${10 + i}`
      ),
    })
    expect(result.success).toBe(false)
  })

  it("rejects duplicate players and empty rosters", () => {
    expect(
      createWarSchema.safeParse({ ...valid, playerIds: [ID, ID] }).success
    ).toBe(false)
    expect(createWarSchema.safeParse({ ...valid, playerIds: [] }).success).toBe(
      false
    )
  })
})

describe("addAttackSchema", () => {
  const valid = {
    warId: ID,
    playerId: OTHER_ID,
    stars: 2,
    destruction: 62,
    durationSec: 161,
    attackedAt: "2026-01-01T12:00:00.000Z",
    targetPosition: 7,
    targetTownHall: 15,
  }

  it("requires the Town Hall of the enemy base", () => {
    for (const targetTownHall of [null, undefined, 0, 99]) {
      expect(
        addAttackSchema.safeParse({ ...valid, targetTownHall }).success
      ).toBe(false)
    }
  })

  it("accepts a consistent attack", () => {
    expect(addAttackSchema.safeParse(valid).success).toBe(true)
  })

  it("flags impossible star/destruction combinations on the destruction field", () => {
    const result = addAttackSchema.safeParse({
      ...valid,
      stars: 2,
      destruction: 40,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["destruction"])
    }
  })

  it("rejects battles longer than three minutes", () => {
    expect(
      addAttackSchema.safeParse({ ...valid, durationSec: 181 }).success
    ).toBe(false)
  })

  it("allows leaving the battle time out", () => {
    expect(
      addAttackSchema.safeParse({ ...valid, durationSec: null }).success
    ).toBe(true)
  })
})

describe("attackWindowIssue", () => {
  const start = "2026-01-01T12:00:00.000Z"

  it("accepts attacks within 48 hours of the start", () => {
    expect(attackWindowIssue("2026-01-01T12:30:00.000Z", start)).toBeNull()
    expect(attackWindowIssue("2026-01-03T12:00:00.000Z", start)).toBeNull()
  })

  it("tolerates the minute precision of datetime inputs right at the start", () => {
    expect(attackWindowIssue("2026-01-01T11:59:30.000Z", start)).toBeNull()
  })

  it("rejects attacks clearly before the war or long after it", () => {
    expect(attackWindowIssue("2026-01-01T11:00:00.000Z", start)).toEqual(
      expect.any(String)
    )
    expect(attackWindowIssue("2026-01-03T12:01:00.000Z", start)).toEqual(
      expect.any(String)
    )
  })
})

describe("createSeasonSchema", () => {
  const valid = {
    name: "October 2026",
    league: "Crystal League II",
    notes: "",
    size: 15,
    playerIds: [ID, OTHER_ID],
  }

  it("accepts a season with or without a league", () => {
    expect(createSeasonSchema.safeParse(valid).success).toBe(true)
    expect(createSeasonSchema.safeParse({ ...valid, league: "" }).success).toBe(
      true
    )
  })

  it("only allows the two CWL sizes", () => {
    expect(createSeasonSchema.safeParse({ ...valid, size: 30 }).success).toBe(
      true
    )
    expect(createSeasonSchema.safeParse({ ...valid, size: 20 }).success).toBe(
      false
    )
  })

  it("rejects unknown leagues and empty rosters", () => {
    expect(
      createSeasonSchema.safeParse({ ...valid, league: "Platinum League I" })
        .success
    ).toBe(false)
    expect(
      createSeasonSchema.safeParse({ ...valid, playerIds: [] }).success
    ).toBe(false)
  })
})

describe("updateSeasonSchema", () => {
  const valid = {
    seasonId: ID,
    name: "October 2026",
    league: "",
    notes: "",
    finalRank: 3,
  }

  it("keeps the final placement within the group of eight", () => {
    expect(updateSeasonSchema.safeParse(valid).success).toBe(true)
    expect(
      updateSeasonSchema.safeParse({ ...valid, finalRank: null }).success
    ).toBe(true)
    expect(
      updateSeasonSchema.safeParse({ ...valid, finalRank: 9 }).success
    ).toBe(false)
    expect(
      updateSeasonSchema.safeParse({ ...valid, finalRank: 0 }).success
    ).toBe(false)
  })
})

describe("createCwlDaySchema", () => {
  const valid = {
    seasonId: ID,
    day: 3,
    opponent: "Night Witches",
    startedAt: null,
    playerIds: [OTHER_ID],
  }

  it("accepts days 1 to 7 only", () => {
    expect(createCwlDaySchema.safeParse(valid).success).toBe(true)
    expect(createCwlDaySchema.safeParse({ ...valid, day: 7 }).success).toBe(
      true
    )
    expect(createCwlDaySchema.safeParse({ ...valid, day: 8 }).success).toBe(
      false
    )
    expect(createCwlDaySchema.safeParse({ ...valid, day: 0 }).success).toBe(
      false
    )
  })

  it("needs an opponent and a lineup", () => {
    expect(
      createCwlDaySchema.safeParse({ ...valid, opponent: " " }).success
    ).toBe(false)
    expect(
      createCwlDaySchema.safeParse({ ...valid, playerIds: [] }).success
    ).toBe(false)
  })
})
