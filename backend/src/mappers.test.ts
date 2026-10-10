import { describe, expect, it } from "vitest"

import type { RawLeagueGroup, RawWar, RawWarClan } from "./coc/api-types.js"
import {
  leagueStandings,
  mapWar,
  mapWarLogEntry,
  parseCocTime,
  parsePhase,
  seasonName,
} from "./mappers.js"

const OURS = "#2PP0JCCL"
const THEIRS = "#8QU8J9LP"

function war(overrides: Partial<RawWar> = {}): RawWar {
  return {
    state: "inWar",
    teamSize: 2,
    attacksPerMember: 2,
    preparationStartTime: "20261009T083000.000Z",
    startTime: "20261010T083000.000Z",
    endTime: "20261011T083000.000Z",
    clan: {
      tag: OURS,
      name: "Us",
      stars: 5,
      destructionPercentage: 92.5,
      members: [
        // Listed out of order and with gaps in mapPosition, as the API does.
        {
          tag: "#LOW",
          name: "Low",
          mapPosition: 7,
          townhallLevel: 14,
          attacks: [
            {
              attackerTag: "#LOW",
              defenderTag: "#E2",
              stars: 2,
              destructionPercentage: 85,
              order: 4,
              duration: 170,
            },
          ],
        },
        {
          tag: "#TOP",
          name: "Top",
          mapPosition: 3,
          townhallLevel: 16,
          attacks: [
            {
              attackerTag: "#TOP",
              defenderTag: "#E2",
              stars: 1,
              destructionPercentage: 60,
              order: 5,
              duration: 120,
            },
            {
              attackerTag: "#TOP",
              defenderTag: "#E1",
              stars: 3,
              destructionPercentage: 100,
              order: 1,
              duration: 95,
            },
          ],
        },
      ],
    },
    opponent: {
      tag: THEIRS,
      name: "Them",
      stars: 3,
      destructionPercentage: 71.5,
      members: [
        { tag: "#E2", name: "Enemy two", mapPosition: 12, townhallLevel: 13 },
        { tag: "#E1", name: "Enemy one", mapPosition: 4, townhallLevel: 17 },
      ],
    },
    ...overrides,
  }
}

const context = { ourTag: OURS, id: "w1", type: "regular" as const }

describe("parseCocTime", () => {
  it("reads the API's compact instants", () => {
    expect(parseCocTime("20261010T083000.000Z")).toBe(
      "2026-10-10T08:30:00.000Z"
    )
  })

  it("rejects anything else", () => {
    expect(parseCocTime(undefined)).toBeNull()
    expect(parseCocTime("2026-10-10")).toBeNull()
  })
})

describe("parsePhase", () => {
  it("accepts both the documented and the real spellings", () => {
    expect(parsePhase("inWar")).toBe("battle")
    expect(parsePhase("IN_WAR")).toBe("battle")
    expect(parsePhase("warEnded")).toBe("ended")
    expect(parsePhase("ENDED")).toBe("ended")
    expect(parsePhase("preparation")).toBe("preparation")
  })

  it("has no phase when there's no war", () => {
    expect(parsePhase("notInWar")).toBeNull()
    expect(parsePhase(undefined)).toBeNull()
  })
})

describe("mapWar", () => {
  it("renumbers both lineups 1..n in map order", () => {
    const mapped = mapWar(war(), context)!
    expect(mapped.roster).toEqual([
      { playerId: "TOP", name: "Top", townHall: 16, position: 1 },
      { playerId: "LOW", name: "Low", townHall: 14, position: 2 },
    ])
    expect(mapped.enemyBases.map((base) => [base.name, base.position])).toEqual(
      [
        ["Enemy one", 1],
        ["Enemy two", 2],
      ]
    )
  })

  it("numbers each player's attacks in the order they were made", () => {
    const mapped = mapWar(war(), context)!
    expect(
      mapped.attacks.map((a) => [
        a.playerId,
        a.order,
        a.sequence,
        a.targetPosition,
      ])
    ).toEqual([
      ["TOP", 1, 1, 1],
      ["LOW", 1, 4, 2],
      ["TOP", 2, 5, 2],
    ])
    expect(mapped.attacks[0]).toMatchObject({
      id: "w1:TOP:1",
      stars: 3,
      destruction: 100,
      durationSec: 95,
      targetTownHall: 17,
      targetName: "Enemy one",
    })
  })

  it("carries the opponent's score and the war's timing", () => {
    const mapped = mapWar(war(), context)!
    expect(mapped).toMatchObject({
      opponent: "Them",
      opponentTag: THEIRS,
      opponentStars: 3,
      opponentDestruction: 71.5,
      size: 2,
      attacksPerMember: 2,
      phase: "battle",
      status: "ongoing",
      startedAt: "2026-10-10T08:30:00.000Z",
      endsAt: "2026-10-11T08:30:00.000Z",
      seasonId: null,
      day: null,
    })
  })

  it("looks at a league war from our side whichever way round it's listed", () => {
    const raw = war({ state: "warEnded", attacksPerMember: undefined })
    const flipped = { ...raw, clan: raw.opponent, opponent: raw.clan }
    const mapped = mapWar(flipped, {
      ourTag: OURS,
      id: "cwl-X",
      type: "cwl",
      seasonId: "2026-10",
      day: 3,
    })!
    expect(mapped.opponent).toBe("Them")
    expect(mapped.roster.map((entry) => entry.playerId)).toEqual(["TOP", "LOW"])
    expect(mapped.attacks).toHaveLength(3)
    expect(mapped).toMatchObject({
      status: "ended",
      attacksPerMember: 1,
      seasonId: "2026-10",
      day: 3,
    })
  })

  it("is null when the clan isn't in a war", () => {
    expect(mapWar({ state: "notInWar" }, context)).toBeNull()
  })
})

describe("mapWarLogEntry", () => {
  const side: RawWarClan = {
    tag: OURS,
    name: "Us",
    attacks: 28,
    stars: 40,
    destructionPercentage: 95.1,
  }

  it("maps a regular war", () => {
    expect(
      mapWarLogEntry({
        result: "lose",
        endTime: "20261001T083000.000Z",
        teamSize: 15,
        attacksPerMember: 2,
        clan: side,
        opponent: {
          tag: THEIRS,
          name: "Them",
          stars: 42,
          destructionPercentage: 97,
        },
      })
    ).toMatchObject({
      id: "log-20261001T083000",
      type: "regular",
      result: "loss",
      opponent: "Them",
      stars: 40,
      attacksUsed: 28,
      opponentStars: 42,
    })
  })

  it("recognises a CWL season by its nameless opponent", () => {
    expect(
      mapWarLogEntry({
        result: null,
        endTime: "20260910T083000.000Z",
        teamSize: 15,
        clan: side,
        opponent: { stars: 231, destructionPercentage: 590 },
      })
    ).toMatchObject({
      type: "cwl",
      result: null,
      opponent: null,
      attacksPerMember: 1,
    })
  })
})

describe("leagueStandings", () => {
  const group: RawLeagueGroup = {
    state: "inWar",
    season: "2026-10",
    rounds: [],
    clans: ["#A", "#B", "#C", "#D"].map((tag) => ({
      tag,
      name: tag,
      members: [],
    })),
  }
  const result = (
    state: string,
    a: [string, number, number],
    b: [string, number, number]
  ): RawWar => ({
    state,
    clan: { tag: a[0], stars: a[1], destructionPercentage: a[2] },
    opponent: { tag: b[0], stars: b[1], destructionPercentage: b[2] },
  })

  it("adds 10 stars per win and ranks by stars, then destruction", () => {
    const table = leagueStandings(
      group,
      [
        result("warEnded", ["#A", 30, 80], ["#B", 28, 90]),
        // Level on stars: destruction decides it.
        result("warEnded", ["#C", 25, 70], ["#D", 25, 75]),
        // Still being fought: stars count, but nobody has won yet.
        result("inWar", ["#A", 12, 40], ["#C", 20, 60]),
        result("preparation", ["#B", 0, 0], ["#D", 0, 0]),
      ],
      "#C"
    )
    expect(
      table.map((row) => [row.tag, row.rank, row.stars, row.wins, row.losses])
    ).toEqual([
      ["#A", 1, 52, 1, 0],
      ["#C", 2, 45, 0, 1],
      ["#D", 3, 35, 1, 0],
      ["#B", 4, 28, 0, 1],
    ])
    expect(table.find((row) => row.isUs)?.tag).toBe("#C")
    expect(table[0].destruction).toBe(120)
  })
})

describe("seasonName", () => {
  it("spells out the month", () => {
    expect(seasonName("2026-10")).toBe("October 2026")
  })
})
