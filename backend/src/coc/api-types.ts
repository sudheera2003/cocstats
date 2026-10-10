// The parts of the Clash of Clans API responses this backend reads, as documented
// at https://developer.clashofclans.com. Enum-like strings are left as `string`
// because the docs list them in UPPER_CASE while the API answers in camelCase.

export interface RawIconUrls {
  tiny?: string
  small?: string
  medium?: string
  large?: string
}

export interface RawLeague {
  id: number
  name: string
  iconUrls?: RawIconUrls
}

export interface RawClanMember {
  tag: string
  name: string
  role: string
  townHallLevel: number
  expLevel: number
  trophies: number
  donations: number
  donationsReceived: number
  league?: RawLeague
  leagueTier?: RawLeague
}

export interface RawClan {
  tag: string
  name: string
  description?: string
  badgeUrls?: RawIconUrls
  clanLevel: number
  clanPoints: number
  members: number
  location?: { name: string }
  warLeague?: { id: number; name: string }
  warFrequency?: string
  warWins: number
  warLosses?: number
  warTies?: number
  warWinStreak: number
  isWarLogPublic: boolean
  memberList?: RawClanMember[]
}

export interface RawWarAttack {
  attackerTag: string
  defenderTag: string
  stars: number
  destructionPercentage: number
  order: number
  duration?: number
}

export interface RawWarMember {
  tag: string
  name: string
  mapPosition: number
  /** War rosters spell it with a lower-case h, unlike the rest of the API. */
  townhallLevel?: number
  townHallLevel?: number
  attacks?: RawWarAttack[]
}

export interface RawWarClan {
  tag?: string
  name?: string
  badgeUrls?: RawIconUrls
  clanLevel?: number
  attacks?: number
  stars: number
  destructionPercentage: number
  members?: RawWarMember[]
}

export interface RawWar {
  state: string
  teamSize?: number
  attacksPerMember?: number
  preparationStartTime?: string
  startTime?: string
  endTime?: string
  clan?: RawWarClan
  opponent?: RawWarClan
}

export interface RawWarLogEntry {
  result?: string | null
  endTime: string
  teamSize: number
  attacksPerMember?: number
  clan: RawWarClan
  opponent: RawWarClan
}

export interface RawWarLog {
  items: RawWarLogEntry[]
}

export interface RawLeagueGroup {
  state: string
  season: string
  clans: {
    tag: string
    name: string
    clanLevel?: number
    badgeUrls?: RawIconUrls
    members: { tag: string; name: string; townHallLevel: number }[]
  }[]
  rounds: { warTags: string[] }[]
}

export interface RawPlayer {
  tag: string
  name: string
  townHallLevel: number
  expLevel: number
  trophies: number
  bestTrophies: number
  warStars: number
  attackWins: number
  defenseWins: number
  donations: number
  donationsReceived: number
  clanCapitalContributions?: number
  warPreference?: string
  league?: RawLeague
  leagueTier?: RawLeague
  heroes?: { name: string; level: number; maxLevel: number; village: string }[]
}
