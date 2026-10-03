export const WAR_TYPES = ["regular", "cwl", "friendly"] as const
export type WarType = (typeof WAR_TYPES)[number]

export const WAR_STATUSES = ["ongoing", "ended"] as const
export type WarStatus = (typeof WAR_STATUSES)[number]

export const PLAYER_ROLES = ["member", "elder", "coLeader", "leader"] as const
export type PlayerRole = (typeof PLAYER_ROLES)[number]

export const ROLE_LABELS: Record<PlayerRole, string> = {
  member: "Member",
  elder: "Elder",
  coLeader: "Co-leader",
  leader: "Leader",
}

const WAR_SIZES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]

export const WAR_TYPE_META: Record<
  WarType,
  { label: string; short: string; attacksPerMember: number; sizes: number[] }
> = {
  regular: {
    label: "Regular war",
    short: "Regular",
    attacksPerMember: 2,
    sizes: WAR_SIZES,
  },
  cwl: {
    label: "Clan War League",
    short: "CWL",
    attacksPerMember: 1,
    sizes: [15, 30],
  },
  friendly: {
    label: "Friendly war",
    short: "Friendly",
    attacksPerMember: 2,
    sizes: WAR_SIZES,
  },
}

export const MAX_WAR_SIZE = 50
export const MAX_TOWN_HALL = 18
export const MAX_ATTACK_SECONDS = 180
// How long after the war start an attack can be logged (prep + battle day).
export const ATTACK_WINDOW_MS = 48 * 60 * 60 * 1000

/** A CWL season is a round-robin week: one war per day against each of the 7 other clans in the group. */
export const CWL_DAYS = 7
export const CWL_GROUP_SIZE = 8
export const CWL_SIZES = [15, 30]
// Stars added to a clan's league standing for winning a day's war (community-documented rule).
export const CWL_WIN_BONUS_STARS = 10
export const MAX_CWL_ROSTER = 50

const LEAGUE_TIERS = [
  "Bronze",
  "Silver",
  "Gold",
  "Crystal",
  "Master",
  "Champion",
]
// Lowest to highest.
export const CWL_LEAGUES = LEAGUE_TIERS.flatMap((tier) =>
  ["III", "II", "I"].map((division) => `${tier} League ${division}`)
)
