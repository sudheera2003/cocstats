import type {
  RawClan,
  RawLeagueGroup,
  RawPlayer,
  RawWar,
  RawWarLog,
} from "./coc/api-types.js"
import { CocApiError, type CocClient } from "./coc/client.js"
import {
  formerMember,
  leagueWarId,
  mapClan,
  mapMember,
  mapPlayerProfile,
  mapSeason,
  mapWar,
  mapWarLogEntry,
  parsePhase,
  regularWarId,
} from "./mappers.js"
import { encodeTag, tagId } from "./tags.js"
import type {
  ClanDTO,
  PlayerDTO,
  PlayerProfileDTO,
  SeasonDTO,
  WarDTO,
  WarLogEntryDTO,
  WarsDTO,
} from "./types.js"

const WAR_LOG_LIMIT = 50
const LEAGUE_WAR_CONCURRENCY = 6
// Rounds that haven't been drawn yet carry this placeholder instead of a war tag.
const NO_WAR_TAG = "#0"

function isMissing(error: unknown) {
  return error instanceof CocApiError && error.status === 404
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await task(items[index])
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  )
  return results
}

export type Service = ReturnType<typeof createService>

/** Everything the app knows about one clan, gathered from the Clash of Clans API. */
export function createService(
  client: CocClient,
  clanTag: string,
  options: { sample?: boolean } = {}
) {
  const clanPath = `/clans/${encodeTag(clanTag)}`
  // A finished league war never changes, so it's only ever fetched once.
  const finishedLeagueWars = new Map<string, RawWar>()

  async function rawClan() {
    return client.get<RawClan>(clanPath)
  }

  /**
   * The API refuses everything about a clan's wars while its war log is
   * private, so those calls are skipped rather than made and failed. Asking the
   * clan first also means a 403 from a war endpoint can only be a key problem.
   */
  async function warsAreVisible() {
    return (await rawClan()).isWarLogPublic
  }

  async function clan(): Promise<ClanDTO> {
    return mapClan(await rawClan(), options.sample)
  }

  async function currentWar(): Promise<WarDTO | null> {
    if (!(await warsAreVisible())) return null
    const raw = await client.get<RawWar>(`${clanPath}/currentwar`)
    return mapWar(raw, {
      ourTag: clanTag,
      id: regularWarId(raw),
      type: "regular",
    })
  }

  async function warLog(): Promise<WarLogEntryDTO[]> {
    if (!(await warsAreVisible())) return []
    const raw = await client.get<RawWarLog>(
      `${clanPath}/warlog?limit=${WAR_LOG_LIMIT}`
    )
    return raw.items.flatMap((entry) => mapWarLogEntry(entry) ?? [])
  }

  async function leagueWar(warTag: string) {
    const known = finishedLeagueWars.get(warTag)
    if (known) return known
    const raw = await client.get<RawWar>(
      `/clanwarleagues/wars/${encodeTag(warTag)}`
    )
    if (parsePhase(raw.state) === "ended") finishedLeagueWars.set(warTag, raw)
    return raw
  }

  /** The current CWL season with our war for each day, or null outside of CWL. */
  async function league(): Promise<{
    season: SeasonDTO
    wars: WarDTO[]
    group: RawLeagueGroup
  } | null> {
    if (!(await warsAreVisible())) return null
    let group: RawLeagueGroup
    try {
      group = await client.get<RawLeagueGroup>(
        `${clanPath}/currentwar/leaguegroup`
      )
    } catch (error) {
      // Not signed up for a league this season.
      if (isMissing(error)) return null
      throw error
    }
    if (!group.season || !group.clans?.length) return null

    const scheduled = (group.rounds ?? []).flatMap((round, index) =>
      round.warTags
        .filter((warTag) => warTag !== NO_WAR_TAG)
        .map((warTag) => ({ warTag, day: index + 1 }))
    )
    const fetched = await mapLimit(
      scheduled,
      LEAGUE_WAR_CONCURRENCY,
      async ({ warTag, day }) => ({ warTag, day, raw: await leagueWar(warTag) })
    )

    const ourWars = fetched.flatMap(({ warTag, day, raw }) => {
      if (raw.clan?.tag !== clanTag && raw.opponent?.tag !== clanTag) return []
      const war = mapWar(raw, {
        ourTag: clanTag,
        id: leagueWarId(warTag),
        type: "cwl",
        seasonId: group.season,
        day,
      })
      return war ?? []
    })
    const season = mapSeason(group, {
      ourTag: clanTag,
      league: (await rawClan()).warLeague?.name ?? null,
      allWars: fetched.map(({ raw }) => raw),
      ourWars,
    })
    return { season, wars: ourWars, group }
  }

  /** Every war the API still shares in full, newest first. */
  async function detailedWars() {
    const [current, leagueData] = await Promise.all([currentWar(), league()])
    const wars = [...(current ? [current] : []), ...(leagueData?.wars ?? [])]
    wars.sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
    return { wars, leagueData }
  }

  async function wars(): Promise<WarsDTO> {
    const [{ wars }, log, visible] = await Promise.all([
      detailedWars(),
      warLog(),
      warsAreVisible(),
    ])
    return { wars, warLog: log, warLogPublic: visible }
  }

  async function season(): Promise<SeasonDTO | null> {
    return (await league())?.season ?? null
  }

  /** Current members, plus anyone else who shows up in the wars we can see. */
  async function players(): Promise<PlayerDTO[]> {
    const [raw, { wars, leagueData }] = await Promise.all([
      rawClan(),
      detailedWars(),
    ])
    const directory = new Map<string, PlayerDTO>(
      (raw.memberList ?? []).map((member) => [
        tagId(member.tag),
        mapMember(member),
      ])
    )
    const add = (entry: { tag: string; name: string; townHall: number }) => {
      const id = tagId(entry.tag)
      if (!directory.has(id)) directory.set(id, formerMember(entry))
    }

    for (const war of wars) {
      for (const entry of war.roster) {
        add({
          tag: `#${entry.playerId}`,
          name: entry.name,
          townHall: entry.townHall,
        })
      }
    }
    const registered =
      leagueData?.group.clans.find((entry) => entry.tag === clanTag)?.members ??
      []
    for (const member of registered) {
      add({
        tag: member.tag,
        name: member.name,
        townHall: member.townHallLevel,
      })
    }

    return [...directory.values()].sort(
      (a, b) =>
        Number(b.active) - Number(a.active) || a.name.localeCompare(b.name)
    )
  }

  /**
   * A player's full profile. Only players this clan's data mentions can be
   * looked up, so the endpoint can't be used as a general proxy for the API key.
   */
  async function playerProfile(tag: string): Promise<PlayerProfileDTO | null> {
    const known = (await players()).some((player) => player.tag === tag)
    if (!known) return null
    try {
      const raw = await client.get<RawPlayer>(`/players/${encodeTag(tag)}`)
      return mapPlayerProfile(raw)
    } catch (error) {
      if (isMissing(error)) return null
      throw error
    }
  }

  return { clan, players, playerProfile, wars, season }
}
