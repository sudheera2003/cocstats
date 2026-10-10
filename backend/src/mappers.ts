import type {
  RawClan,
  RawClanMember,
  RawIconUrls,
  RawLeague,
  RawLeagueGroup,
  RawPlayer,
  RawWar,
  RawWarClan,
  RawWarLogEntry,
  RawWarMember,
} from "./coc/api-types.js"
import { tagId } from "./tags.js"
import type {
  AttackDTO,
  ClanDTO,
  EnemyBaseDTO,
  LeagueDTO,
  PlayerDTO,
  PlayerProfileDTO,
  PlayerRole,
  RosterEntryDTO,
  SeasonDTO,
  SeasonStandingDTO,
  WarDTO,
  WarLogEntryDTO,
  WarPhase,
  WarType,
} from "./types.js"

// Stars added to a clan's league standing for winning a day's war. Keep in step
// with CWL_WIN_BONUS_STARS in frontend/lib/constants.ts.
const CWL_WIN_BONUS_STARS = 10

/** "20261010T083000.000Z" (how the API writes instants) -> "2026-10-10T08:30:00.000Z". */
export function parseCocTime(value: string | undefined): string | null {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/.exec(
    value ?? ""
  )
  if (!match) return null
  const [, y, mo, d, h, mi, s, ms] = match
  return `${y}-${mo}-${d}T${h}:${mi}:${s}.${ms}Z`
}

// The docs spell states as IN_WAR / WAR_ENDED, the API as inWar / warEnded.
const squash = (value: string | null | undefined) =>
  (value ?? "").replace(/_/g, "").toLowerCase()

/** The phase of a war or league group, or null when there's no war to speak of. */
export function parsePhase(state: string | undefined): WarPhase | null {
  switch (squash(state)) {
    case "preparation":
      return "preparation"
    case "inwar":
    case "war":
      return "battle"
    case "warended":
    case "ended":
      return "ended"
    default:
      return null
  }
}

function parseRole(role: string | undefined): PlayerRole {
  switch (squash(role)) {
    case "leader":
      return "leader"
    case "coleader":
      return "coLeader"
    // The API still calls elders by their old name.
    case "admin":
      return "elder"
    default:
      return "member"
  }
}

function icon(urls: RawIconUrls | undefined) {
  return urls?.medium ?? urls?.small ?? urls?.large ?? urls?.tiny ?? null
}

function mapLeague(league: RawLeague | undefined): LeagueDTO | null {
  return league ? { name: league.name, icon: icon(league.iconUrls) } : null
}

export function mapMember(raw: RawClanMember): PlayerDTO {
  return {
    id: tagId(raw.tag),
    name: raw.name,
    tag: raw.tag,
    townHall: raw.townHallLevel,
    role: parseRole(raw.role),
    active: true,
    expLevel: raw.expLevel,
    trophies: raw.trophies,
    league: mapLeague(raw.leagueTier ?? raw.league),
    donations: raw.donations,
    donationsReceived: raw.donationsReceived,
  }
}

/** Someone who fought in a war but isn't in the clan's member list any more. */
export function formerMember(entry: {
  tag: string
  name: string
  townHall: number
}): PlayerDTO {
  return {
    id: tagId(entry.tag),
    name: entry.name,
    tag: entry.tag,
    townHall: entry.townHall,
    role: "member",
    active: false,
    expLevel: null,
    trophies: null,
    league: null,
    donations: null,
    donationsReceived: null,
  }
}

export function mapClan(raw: RawClan, sample = false): ClanDTO {
  return {
    tag: raw.tag,
    name: raw.name,
    description: raw.description ?? "",
    badge: icon(raw.badgeUrls),
    level: raw.clanLevel,
    points: raw.clanPoints,
    memberCount: raw.members,
    location: raw.location?.name ?? null,
    warLeague: raw.warLeague?.name ?? null,
    warFrequency: raw.warFrequency ?? null,
    warWins: raw.warWins,
    warLosses: raw.warLosses ?? null,
    warTies: raw.warTies ?? null,
    warWinStreak: raw.warWinStreak,
    warLogPublic: raw.isWarLogPublic,
    sample,
  }
}

const townHallOf = (member: RawWarMember) =>
  member.townhallLevel ?? member.townHallLevel ?? 0

/**
 * A side's bases, strongest first and numbered 1..n. The API's mapPosition can
 * skip numbers (in CWL it counts through the whole registered roster), so the
 * order is kept and the numbering redone.
 */
function lineup(side: RawWarClan) {
  return [...(side.members ?? [])]
    .sort((a, b) => a.mapPosition - b.mapPosition)
    .map((member, index) => ({ member, position: index + 1 }))
}

/** Stable id for a regular war: the API has none, but a clan only preps one war at a time. */
export function regularWarId(raw: RawWar) {
  const prep = (raw.preparationStartTime ?? "").slice(0, 15)
  return `${prep}-${tagId(raw.opponent?.tag ?? "")}`
}

export function leagueWarId(warTag: string) {
  return `cwl-${tagId(warTag)}`
}

/**
 * Turns one war from the API into ours, seen from `ourTag`'s side (league wars
 * list the two clans in no particular order). Null when the response isn't an
 * actual war, e.g. the clan isn't in one.
 */
export function mapWar(
  raw: RawWar,
  context: {
    ourTag: string
    id: string
    type: WarType
    seasonId?: string
    day?: number
  }
): WarDTO | null {
  const phase = parsePhase(raw.state)
  const preparationStartedAt = parseCocTime(raw.preparationStartTime)
  const startedAt = parseCocTime(raw.startTime)
  const endsAt = parseCocTime(raw.endTime)
  if (!phase || !raw.clan || !raw.opponent) return null
  if (!preparationStartedAt || !startedAt || !endsAt) return null

  const [us, them] =
    raw.opponent.tag === context.ourTag
      ? [raw.opponent, raw.clan]
      : [raw.clan, raw.opponent]
  const ours = lineup(us)
  const theirs = lineup(them)

  const roster: RosterEntryDTO[] = ours.map(({ member, position }) => ({
    playerId: tagId(member.tag),
    name: member.name,
    townHall: townHallOf(member),
    position,
  }))
  const enemyBases: EnemyBaseDTO[] = theirs.map(({ member, position }) => ({
    tag: member.tag,
    name: member.name,
    townHall: townHallOf(member),
    position,
  }))
  const enemyByTag = new Map(enemyBases.map((base) => [base.tag, base]))

  const made = new Map<string, number>()
  const attacks: AttackDTO[] = ours
    .flatMap(({ member }) => member.attacks ?? [])
    .sort((a, b) => a.order - b.order)
    .flatMap((attack) => {
      const target = enemyByTag.get(attack.defenderTag)
      if (!target) return []
      const playerId = tagId(attack.attackerTag)
      const order = (made.get(playerId) ?? 0) + 1
      made.set(playerId, order)
      return [
        {
          id: `${context.id}:${playerId}:${order}`,
          playerId,
          order,
          sequence: attack.order,
          stars: attack.stars,
          destruction: attack.destructionPercentage,
          durationSec: attack.duration ?? null,
          targetPosition: target.position,
          targetTownHall: target.townHall || null,
          targetName: target.name,
        },
      ]
    })

  return {
    id: context.id,
    type: context.type,
    opponent: them.name ?? "Unknown clan",
    opponentTag: them.tag ?? "",
    opponentBadge: icon(them.badgeUrls),
    size: raw.teamSize ?? roster.length,
    attacksPerMember: raw.attacksPerMember ?? (context.type === "cwl" ? 1 : 2),
    phase,
    status: phase === "ended" ? "ended" : "ongoing",
    preparationStartedAt,
    startedAt,
    endsAt,
    roster,
    attacks,
    enemyBases,
    opponentStars: them.stars,
    opponentDestruction: them.destructionPercentage,
    seasonId: context.seasonId ?? null,
    day: context.day ?? null,
  }
}

function parseResult(result: string | null | undefined) {
  switch (squash(result)) {
    case "win":
      return "win" as const
    case "lose":
      return "loss" as const
    case "tie":
      return "tie" as const
    default:
      return null
  }
}

export function mapWarLogEntry(raw: RawWarLogEntry): WarLogEntryDTO | null {
  const endedAt = parseCocTime(raw.endTime)
  if (!endedAt) return null
  // A whole CWL season is logged as one entry: no result and a nameless opponent.
  const isLeague = !raw.opponent.name
  return {
    id: `log-${raw.endTime.slice(0, 15)}`,
    type: isLeague ? "cwl" : "regular",
    result: parseResult(raw.result),
    endedAt,
    size: raw.teamSize,
    attacksPerMember: raw.attacksPerMember ?? (isLeague ? 1 : 2),
    opponent: raw.opponent.name ?? null,
    opponentTag: raw.opponent.tag ?? null,
    stars: raw.clan.stars,
    destruction: raw.clan.destructionPercentage,
    attacksUsed: raw.clan.attacks ?? 0,
    opponentStars: raw.opponent.stars,
    opponentDestruction: raw.opponent.destructionPercentage,
  }
}

/** "2026-10" -> "October 2026". */
export function seasonName(season: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(season)
  if (!match) return season
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1))
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

/** The league table of a CWL group, worked out from every war played so far. */
export function leagueStandings(
  group: RawLeagueGroup,
  wars: RawWar[],
  ourTag: string
): SeasonStandingDTO[] {
  const table = new Map(
    group.clans.map((clan) => [
      clan.tag,
      {
        tag: clan.tag,
        name: clan.name,
        badge: icon(clan.badgeUrls),
        warStars: 0,
        destruction: 0,
        wins: 0,
        losses: 0,
        ties: 0,
      },
    ])
  )

  for (const war of wars) {
    const phase = parsePhase(war.state)
    if (!war.clan || !war.opponent || !phase || phase === "preparation") {
      continue
    }
    const sides = [
      [war.clan, war.opponent],
      [war.opponent, war.clan],
    ] as const
    for (const [side, other] of sides) {
      const row = table.get(side.tag ?? "")
      if (!row) continue
      row.warStars += side.stars
      row.destruction += side.destructionPercentage
      if (phase !== "ended") continue
      // Stars decide a war, destruction breaks a tie.
      const gap =
        side.stars - other.stars ||
        side.destructionPercentage - other.destructionPercentage
      if (gap > 0) row.wins += 1
      else if (gap < 0) row.losses += 1
      else row.ties += 1
    }
  }

  return [...table.values()]
    .map(({ warStars, ...row }) => ({
      ...row,
      stars: warStars + row.wins * CWL_WIN_BONUS_STARS,
    }))
    .sort((a, b) => b.stars - a.stars || b.destruction - a.destruction)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      isUs: row.tag === ourTag,
    }))
}

export function mapSeason(
  group: RawLeagueGroup,
  options: {
    ourTag: string
    league: string | null
    /** Every war of the group that could be fetched, ours or not. */
    allWars: RawWar[]
    /** Our own wars, already mapped. */
    ourWars: WarDTO[]
  }
): SeasonDTO {
  const us = group.clans.find((clan) => clan.tag === options.ourTag)
  const standings = leagueStandings(group, options.allWars, options.ourTag)
  const started = options.ourWars.some((war) => war.phase !== "preparation")
  return {
    id: group.season,
    name: seasonName(group.season),
    league: options.league,
    state: parsePhase(group.state) ?? "preparation",
    size: options.ourWars[0]?.size ?? 15,
    rosterIds: (us?.members ?? []).map((member) => tagId(member.tag)),
    rank: started ? (standings.find((row) => row.isUs)?.rank ?? null) : null,
    standings,
  }
}

export function mapPlayerProfile(raw: RawPlayer): PlayerProfileDTO {
  const preference = squash(raw.warPreference)
  return {
    tag: raw.tag,
    name: raw.name,
    townHall: raw.townHallLevel,
    expLevel: raw.expLevel,
    trophies: raw.trophies,
    bestTrophies: raw.bestTrophies,
    warStars: raw.warStars,
    attackWins: raw.attackWins,
    defenseWins: raw.defenseWins,
    donations: raw.donations,
    donationsReceived: raw.donationsReceived,
    clanCapitalContributions: raw.clanCapitalContributions ?? 0,
    warPreference:
      preference === "in" || preference === "out" ? preference : null,
    league: mapLeague(raw.leagueTier ?? raw.league),
    heroes: (raw.heroes ?? [])
      .filter(
        (hero) =>
          squash(hero.village) === "homevillage" ||
          squash(hero.village) === "home"
      )
      .map(({ name, level, maxLevel }) => ({ name, level, maxLevel })),
  }
}
