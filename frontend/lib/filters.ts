import { WAR_TYPE_META, WAR_TYPES, type WarType } from "./constants"

const TYPE_OPTIONS = WAR_TYPES.map((type) => ({
  value: type,
  label: WAR_TYPE_META[type].short,
}))

function parse<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  const single = Array.isArray(value) ? value[0] : value
  return allowed.find((option) => option === single) ?? fallback
}

/** For anything that shows stats. "Overall" is Regular plus CWL together. */
export type StatsFilter = "overall" | WarType

export const STATS_FILTER_OPTIONS = [
  { value: "overall", label: "Overall" },
  ...TYPE_OPTIONS,
]

export function parseStatsFilter(
  value: string | string[] | undefined
): StatsFilter {
  return parse<StatsFilter>(value, ["overall", ...WAR_TYPES], "overall")
}

/** For the list of wars, where "all" really does mean every war. */
export type WarListFilter = "all" | WarType

export const WAR_LIST_FILTER_OPTIONS = [
  { value: "all", label: "All wars" },
  ...TYPE_OPTIONS,
]

export function parseWarListFilter(
  value: string | string[] | undefined
): WarListFilter {
  return parse<WarListFilter>(value, ["all", ...WAR_TYPES], "all")
}
