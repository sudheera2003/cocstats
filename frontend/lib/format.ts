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

/** e.g. "Our #1 on base #1: a mirror attack". Lower base numbers are stronger. */
export function describeRankMatchup(
  range: { low: number; high: number },
  targetPosition: number
) {
  const ours =
    range.low === range.high ? `#${range.low}` : `#${range.low}-${range.high}`
  if (targetPosition < range.low) {
    return `Our ${ours} hitting up ${pluralize(range.low - targetPosition, "position")} on base #${targetPosition}`
  }
  if (targetPosition > range.high) {
    return `Our ${ours} hitting down ${pluralize(targetPosition - range.high, "position")} on base #${targetPosition}`
  }
  return `Our ${ours} on base #${targetPosition}: a mirror attack`
}
