export const WAR_TYPES = ["regular", "cwl"] as const
export type WarType = (typeof WAR_TYPES)[number]

export type WarStatus = "ongoing" | "ended"
export type WarPhase = "preparation" | "battle" | "ended"

export type PlayerRole = "member" | "elder" | "coLeader" | "leader"

export const ROLE_LABELS: Record<PlayerRole, string> = {
  member: "Member",
  elder: "Elder",
  coLeader: "Co-leader",
  leader: "Leader",
}

export const WAR_TYPE_META: Record<WarType, { label: string; short: string }> =
  {
    regular: { label: "Regular war", short: "Regular" },
    cwl: { label: "Clan War League", short: "CWL" },
  }

/** A CWL season is a round-robin week: one war per day against each of the 7 other clans in the group. */
export const CWL_DAYS = 7
export const CWL_GROUP_SIZE = 8
// Stars added to a clan's league standing for winning a day's war (community-documented rule).
// Keep in step with the same constant in backend/src/mappers.ts.
export const CWL_WIN_BONUS_STARS = 10
/** The most players a clan can register for a CWL season. */
export const MAX_CWL_ROSTER = 50
