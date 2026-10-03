export const EMPTY = "—"

export function formatNumber(value: number | null, digits = 2) {
  return value === null ? EMPTY : value.toFixed(digits)
}

/** Formats a value that is already a percentage (87.5 -> "87.5%"). */
export function formatPercent(value: number | null, digits = 1) {
  return value === null ? EMPTY : `${value.toFixed(digits)}%`
}

/** Formats a 0-1 ratio as a whole percentage (0.625 -> "63%"). */
export function formatRate(ratio: number | null) {
  return ratio === null ? EMPTY : `${Math.round(ratio * 100)}%`
}

/** Seconds as m:ss. */
export function formatDuration(seconds: number | null) {
  if (seconds === null) return EMPTY
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`
}

/** Time elapsed since the war started, e.g. "+3h 12m". Never negative. */
export function formatOffset(fromIso: string, toIso: string) {
  const minutes = Math.max(
    0,
    Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 60_000)
  )
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `+${hours}h ${minutes % 60}m` : `+${minutes}m`
}

export function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`
}

export type DateVariant = "date" | "datetime" | "time"

const DATE_OPTIONS: Record<DateVariant, Intl.DateTimeFormatOptions> = {
  date: { dateStyle: "medium" },
  datetime: { dateStyle: "medium", timeStyle: "short" },
  time: { timeStyle: "short" },
}

export function formatDate(
  iso: string,
  variant: DateVariant = "datetime",
  timeZone?: string
) {
  return new Intl.DateTimeFormat("en-US", {
    ...DATE_OPTIONS[variant],
    timeZone,
  }).format(new Date(iso))
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

/** ISO instant -> value for <input type="datetime-local"> in the browser's timezone. */
export function toDateTimeLocal(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Value of <input type="datetime-local"> -> ISO instant, or null when empty/invalid. */
export function fromDateTimeLocal(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export type MatchupDirection = "up" | "same" | "down"

export function matchupDirection(
  attackerTownHall: number,
  enemyTownHall: number
): MatchupDirection {
  if (enemyTownHall > attackerTownHall) return "up"
  return enemyTownHall < attackerTownHall ? "down" : "same"
}

/** e.g. "TH16 hitting up 1 level against TH17". */
export function describeMatchup(
  attackerTownHall: number,
  enemyTownHall: number
) {
  const diff = Math.abs(enemyTownHall - attackerTownHall)
  switch (matchupDirection(attackerTownHall, enemyTownHall)) {
    case "up":
      return `TH${attackerTownHall} hitting up ${pluralize(diff, "level")} against TH${enemyTownHall}`
    case "down":
      return `TH${attackerTownHall} hitting down ${pluralize(diff, "level")} against TH${enemyTownHall}`
    default:
      return `Same Town Hall: TH${attackerTownHall} against TH${enemyTownHall}`
  }
}
