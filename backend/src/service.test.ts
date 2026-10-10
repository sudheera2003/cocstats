import { describe, expect, it } from "vitest"

import type { RawClan } from "./coc/api-types.js"
import { CocApiError, type CocClient } from "./coc/client.js"
import { createMockClient } from "./coc/mock.js"
import { createService } from "./service.js"

const CLAN = "#2PP0JCCL"

describe("createService", () => {
  const service = createService(createMockClient(CLAN), CLAN)

  it("gathers the current war and every day of the CWL season", async () => {
    const { wars, warLog, warLogPublic } = await service.wars()
    expect(warLogPublic).toBe(true)
    expect(wars.filter((war) => war.type === "regular")).toHaveLength(1)

    const league = wars.filter((war) => war.type === "cwl")
    expect(league.map((war) => war.day).sort()).toEqual([1, 2, 3, 4, 5])
    expect(new Set(league.map((war) => war.opponent)).size).toBe(5)
    for (const war of league) {
      expect(war.seasonId).toMatch(/^\d{4}-\d{2}$/)
      expect(war.roster.map((entry) => entry.position)).toEqual(
        Array.from({ length: 15 }, (_, index) => index + 1)
      )
      for (const attack of war.attacks) {
        expect(attack.targetPosition).toBeGreaterThanOrEqual(1)
        expect(attack.targetPosition).toBeLessThanOrEqual(15)
      }
    }

    expect(warLog).toHaveLength(25)
    expect(warLog.filter((entry) => entry.type === "cwl")).toHaveLength(1)
  })

  it("ranks the league group", async () => {
    const season = (await service.season())!
    expect(season.standings).toHaveLength(8)
    expect(season.standings.map((row) => row.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ])
    expect(season.rank).toBe(season.standings.find((row) => row.isUs)!.rank)
    expect(season.rosterIds).toHaveLength(20)
    expect(season.size).toBe(15)
  })

  it("lists members and only looks up players it knows", async () => {
    const players = await service.players()
    expect(players).toHaveLength(30)
    expect(players.every((player) => player.active)).toBe(true)

    const profile = await service.playerProfile(players[0].tag)
    expect(profile?.name).toBe(players[0].name)
    expect(profile?.heroes.map((hero) => hero.name)).not.toContain(
      "Battle Machine"
    )
    expect(await service.playerProfile("#2222")).toBeNull()
  })
})

describe("createService and war endpoints that refuse", () => {
  /** The mock API, except that every war endpoint answers 403. */
  function refusing(isWarLogPublic: boolean) {
    const inner = createMockClient(CLAN)
    const asked: string[] = []
    const client: CocClient = {
      async get<T>(path: string) {
        asked.push(path)
        if (/currentwar|warlog|clanwarleagues/.test(path)) {
          throw new CocApiError(403, "accessDenied", "Access denied")
        }
        const clan = await inner.get<RawClan>(path)
        return { ...clan, isWarLogPublic } as T
      },
    }
    return { service: createService(client, CLAN), asked }
  }

  it("serves a clan with a private war log without asking for its wars", async () => {
    const { service, asked } = refusing(false)
    expect(await service.wars()).toEqual({
      wars: [],
      warLog: [],
      warLogPublic: false,
    })
    expect(await service.season()).toBeNull()
    expect(await service.players()).toHaveLength(30)
    expect(asked.every((path) => !/war/.test(path))).toBe(true)
  })

  it("reports the refusal when the war log is public, since then it's the key", async () => {
    const { service } = refusing(true)
    await expect(service.wars()).rejects.toMatchObject({ status: 403 })
  })
})
