import type {
  RawClan,
  RawLeagueGroup,
  RawPlayer,
  RawWar,
  RawWarAttack,
  RawWarClan,
  RawWarLog,
  RawWarMember,
} from "./api-types.js"
import { CocApiError, type CocClient } from "./client.js"

// A generated stand-in for api.clashofclans.com (COC_MOCK=1), so the app can be
// run and worked on without an API key or an allowed IP address. It answers the
// same paths with the same shapes: a clan, a war in progress, a war log and a
// CWL season on its fourth day. Everything is seeded, so it only changes when
// the UTC date does.

const DAY = 24 * 60 * 60 * 1000
const TAG_ALPHABET = "0289PYLQGRJCUV"

const PLAYER_NAMES = [
  "Aragorn",
  "Blaze",
  "Cobra",
  "Dexter",
  "Echo",
  "Falcon",
  "Ghost",
  "Hunter",
  "Iceman",
  "Joker",
  "Kraken",
  "Loki",
  "Maverick",
  "Nova",
  "Onyx",
  "Phoenix",
  "Quake",
  "Raptor",
  "Shadow",
  "Titan",
  "Ursa",
  "Viper",
  "Wraith",
  "Xerxes",
  "Yeti",
  "Zephyr",
  "Ace",
  "Bolt",
  "Cipher",
  "Drake",
]

const CLAN_NAMES = [
  "Night Raiders",
  "Iron Legion",
  "Golden Horde",
  "Storm Breakers",
  "Dark Empire",
  "Royal Guards",
  "Wild Wolves",
  "Fire Nation",
  "Sky Titans",
  "Lost Kings",
  "Elite Squad",
  "War Machine",
  "Red Dragons",
  "Frozen Throne",
  "Silent Blades",
  "Thunder Clan",
]

type Random = () => number

function seeded(seed: number): Random {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const between = (random: Random, low: number, high: number) =>
  low + Math.floor(random() * (high - low + 1))

function makeTag(random: Random) {
  let tag = "#"
  for (let i = 0; i < 8; i += 1) tag += TAG_ALPHABET[between(random, 0, 13)]
  return tag
}

function shuffle<T>(random: Random, items: T[]) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = between(random, 0, i)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function cocTime(ms: number) {
  return new Date(ms).toISOString().replace(/[-:]/g, "")
}

function badge(hue: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 4 56 14v18c0 14-10 24-24 28C18 56 8 46 8 32V14z" fill="hsl(${hue} 65% 45%)" stroke="hsl(${hue} 65% 25%)" stroke-width="4"/></svg>`
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`
  return { small: url, medium: url, large: url }
}

interface Side {
  tag: string
  name: string
  level: number
  hue: number
  members: { tag: string; name: string; townHall: number }[]
}

function makeSide(
  random: Random,
  name: string,
  size: number,
  tag?: string
): Side {
  const names = shuffle(random, PLAYER_NAMES)
  const members = Array.from({ length: size }, (_, index) => ({
    tag: makeTag(random),
    name: tag
      ? PLAYER_NAMES[index]
      : `${names[index % names.length]}${between(random, 1, 99)}`,
    // Strongest first, tapering off down the roster.
    townHall: Math.max(11, 18 - Math.floor(index / 4) - between(random, 0, 1)),
  })).sort((a, b) => b.townHall - a.townHall)
  return {
    tag: tag ?? makeTag(random),
    name,
    level: between(random, 8, 25),
    hue: between(random, 0, 359),
    members,
  }
}

function rollAttack(
  random: Random,
  attackerTownHall: number,
  defenderTownHall: number
) {
  const triple = Math.min(
    0.9,
    Math.max(0.1, 0.45 + 0.12 * (attackerTownHall - defenderTownHall))
  )
  const roll = random()
  if (roll < triple) return { stars: 3, destructionPercentage: 100 }
  if (roll < triple + 0.35)
    return { stars: 2, destructionPercentage: between(random, 50, 99) }
  if (roll < triple + 0.5)
    return { stars: 1, destructionPercentage: between(random, 30, 85) }
  return { stars: 0, destructionPercentage: between(random, 8, 49) }
}

function playWar(
  random: Random,
  a: Side,
  b: Side,
  options: {
    size: number
    attacksPerMember: number
    state: "preparation" | "inWar" | "warEnded"
    battleStart: number
    /** Share of all attacks that have been made. */
    progress: number
    /** Number bases the way CWL does, with gaps. */
    sparsePositions?: boolean
  }
): RawWar {
  const { size, attacksPerMember, state, battleStart } = options
  const lineups = [a, b].map((side) => side.members.slice(0, size))
  const attacks: RawWarAttack[][][] = lineups.map((lineup) =>
    lineup.map(() => [])
  )

  if (state !== "preparation") {
    const slots = shuffle(
      random,
      [0, 1].flatMap((side) =>
        lineups[side].flatMap((_, index) =>
          Array.from({ length: attacksPerMember }, () => ({ side, index }))
        )
      )
    )
    const made = Math.round(slots.length * options.progress)
    slots.slice(0, made).forEach(({ side, index }, order) => {
      const attacker = lineups[side][index]
      const targetIndex = Math.min(
        size - 1,
        Math.max(0, index + between(random, -2, 2))
      )
      const defender = lineups[1 - side][targetIndex]
      attacks[side][index].push({
        attackerTag: attacker.tag,
        defenderTag: defender.tag,
        order: order + 1,
        duration: between(random, 55, 180),
        ...rollAttack(random, attacker.townHall, defender.townHall),
      })
    })
  }

  const sides = [a, b].map((side, sideIndex): RawWarClan => {
    const best = new Map<string, { stars: number; destruction: number }>()
    for (const attack of attacks[sideIndex].flat()) {
      const current = best.get(attack.defenderTag) ?? {
        stars: 0,
        destruction: 0,
      }
      best.set(attack.defenderTag, {
        stars: Math.max(current.stars, attack.stars),
        destruction: Math.max(
          current.destruction,
          attack.destructionPercentage
        ),
      })
    }
    const totals = [...best.values()]
    const members = lineups[sideIndex].map((member, index): RawWarMember => ({
      tag: member.tag,
      name: member.name,
      townhallLevel: member.townHall,
      mapPosition: options.sparsePositions ? index * 2 + 1 : index + 1,
      ...(attacks[sideIndex][index].length > 0 && {
        attacks: attacks[sideIndex][index],
      }),
    }))
    return {
      tag: side.tag,
      name: side.name,
      badgeUrls: badge(side.hue),
      clanLevel: side.level,
      attacks: attacks[sideIndex].flat().length,
      stars: totals.reduce((sum, entry) => sum + entry.stars, 0),
      destructionPercentage:
        totals.reduce((sum, entry) => sum + entry.destruction, 0) / size,
      // Listed in no particular order, like the real thing.
      members: shuffle(random, members),
    }
  })

  return {
    state,
    teamSize: size,
    attacksPerMember,
    preparationStartTime: cocTime(battleStart - DAY),
    startTime: cocTime(battleStart),
    endTime: cocTime(battleStart + DAY),
    clan: sides[0],
    opponent: sides[1],
  }
}

/** Pairings for a round robin of 8: every clan meets every other exactly once over 7 rounds. */
function roundRobin(count: number) {
  const order = Array.from({ length: count }, (_, index) => index)
  return Array.from({ length: count - 1 }, () => {
    const pairs = Array.from(
      { length: count / 2 },
      (_, index) => [order[index], order[count - 1 - index]] as const
    )
    order.splice(1, 0, order.pop()!)
    return pairs
  })
}

function build(clanTag: string, today: number) {
  const random = seeded(Math.floor(today / DAY))
  const responses = new Map<string, unknown>()
  const enc = encodeURIComponent
  const clanPath = `/clans/${enc(clanTag)}`

  const us = makeSide(seeded(7), "Mock Warriors", 30, clanTag)
  const roles = ["leader", "coLeader", "coLeader", "admin", "admin", "admin"]

  const clan: RawClan = {
    tag: us.tag,
    name: us.name,
    description: "Sample clan served by the backend's mock mode.",
    badgeUrls: badge(28),
    clanLevel: 17,
    clanPoints: 41250,
    members: us.members.length,
    location: { name: "International" },
    warLeague: { id: 48000012, name: "Crystal League I" },
    warFrequency: "always",
    warWins: 214,
    warLosses: 96,
    warTies: 4,
    warWinStreak: 3,
    isWarLogPublic: true,
    memberList: us.members.map((member, index) => ({
      tag: member.tag,
      name: member.name,
      role: roles[index] ?? "member",
      townHallLevel: member.townHall,
      expLevel: 120 + member.townHall * 6 - index,
      trophies: 5200 - index * 70,
      donations: between(random, 0, 2400),
      donationsReceived: between(random, 0, 1800),
      leagueTier: {
        id: 105000000 + index,
        name: index < 6 ? "Legend League" : "Titan League I",
      },
    })),
  }
  responses.set(clanPath, clan)

  for (const [index, member] of us.members.entries()) {
    const profile: RawPlayer = {
      tag: member.tag,
      name: member.name,
      townHallLevel: member.townHall,
      expLevel: 120 + member.townHall * 6 - index,
      trophies: 5200 - index * 70,
      bestTrophies: 5900 - index * 40,
      warStars: 1900 - index * 45,
      attackWins: between(random, 20, 180),
      defenseWins: between(random, 0, 30),
      donations: clan.memberList![index].donations,
      donationsReceived: clan.memberList![index].donationsReceived,
      clanCapitalContributions: between(random, 100_000, 2_500_000),
      warPreference: index % 7 === 6 ? "out" : "in",
      leagueTier: clan.memberList![index].leagueTier,
      heroes: [
        {
          name: "Barbarian King",
          level: member.townHall * 5,
          maxLevel: 100,
          village: "home",
        },
        {
          name: "Archer Queen",
          level: member.townHall * 5 - 2,
          maxLevel: 100,
          village: "home",
        },
        {
          name: "Grand Warden",
          level: member.townHall * 4 - 6,
          maxLevel: 75,
          village: "home",
        },
        {
          name: "Battle Machine",
          level: 30,
          maxLevel: 35,
          village: "builderBase",
        },
      ],
    }
    responses.set(`/players/${enc(member.tag)}`, profile)
  }

  // A regular war on battle day since midnight UTC.
  responses.set(
    `${clanPath}/currentwar`,
    playWar(random, us, makeSide(random, CLAN_NAMES[0], 15), {
      size: 15,
      attacksPerMember: 2,
      state: "inWar",
      battleStart: today,
      progress: 0.6,
    })
  )

  const warLog: RawWarLog = {
    items: Array.from({ length: 24 }, (_, index) => {
      const ours = between(random, 30, 45)
      const theirs = between(random, 27, 45)
      const destruction = () => 70 + between(random, 0, 3000) / 100
      return {
        result: ours === theirs ? "tie" : ours > theirs ? "win" : "lose",
        endTime: cocTime(today - (index + 1) * 2 * DAY),
        teamSize: 15,
        attacksPerMember: 2,
        clan: {
          tag: us.tag,
          name: us.name,
          badgeUrls: clan.badgeUrls,
          clanLevel: clan.clanLevel,
          attacks: between(random, 24, 30),
          stars: ours,
          destructionPercentage: destruction(),
        },
        opponent: {
          tag: makeTag(random),
          name: CLAN_NAMES[(index + 1) % CLAN_NAMES.length],
          badgeUrls: badge(between(random, 0, 359)),
          clanLevel: between(random, 5, 25),
          stars: theirs,
          destructionPercentage: destruction(),
        },
      }
    }),
  }
  // Last month's CWL season, logged the way the API does: one nameless entry.
  warLog.items.splice(8, 0, {
    result: null,
    endTime: cocTime(today - 17.5 * DAY),
    teamSize: 15,
    attacksPerMember: 1,
    clan: {
      ...warLog.items[0].clan,
      attacks: 98,
      stars: 247,
      destructionPercentage: 612.4,
    },
    opponent: {
      badgeUrls: {},
      clanLevel: 0,
      stars: 231,
      destructionPercentage: 590.1,
    },
  })
  responses.set(`${clanPath}/warlog`, warLog)

  // A CWL season: days 1-3 finished, day 4 being fought, day 5 in preparation.
  const league = [
    { ...us, members: us.members.slice(0, 20) },
    ...CLAN_NAMES.slice(1, 8).map((name) => makeSide(random, name, 18)),
  ]
  const group: RawLeagueGroup = {
    state: "inWar",
    season: new Date(today).toISOString().slice(0, 7),
    clans: league.map((side) => ({
      tag: side.tag,
      name: side.name,
      clanLevel: side.level,
      badgeUrls: badge(side.hue),
      members: side.members.map((member) => ({
        tag: member.tag,
        name: member.name,
        townHallLevel: member.townHall,
      })),
    })),
    rounds: roundRobin(league.length).map((pairs, round) => ({
      warTags: pairs.map(([a, b]) => {
        const day = round + 1
        if (day > 5) return "#0"
        const warTag = makeTag(random)
        responses.set(
          `/clanwarleagues/wars/${enc(warTag)}`,
          playWar(random, league[a], league[b], {
            size: 15,
            attacksPerMember: 1,
            state: day < 4 ? "warEnded" : day === 4 ? "inWar" : "preparation",
            battleStart: today + (day - 4) * DAY,
            progress: day < 4 ? between(random, 85, 100) / 100 : 0.5,
            sparsePositions: true,
          })
        )
        return warTag
      }),
    })),
  }
  responses.set(`${clanPath}/currentwar/leaguegroup`, group)

  return responses
}

export function createMockClient(clanTag: string): CocClient {
  let built: { today: number; responses: Map<string, unknown> } | null = null

  return {
    async get<T>(path: string) {
      const today = Math.floor(Date.now() / DAY) * DAY
      if (built?.today !== today) {
        built = { today, responses: build(clanTag, today) }
      }
      const response = built.responses.get(path.split("?")[0])
      if (response === undefined) {
        throw new CocApiError(404, "notFound", "Not found in the mock data")
      }
      return response as T
    },
  }
}
