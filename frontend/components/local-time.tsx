"use client"

import { useSyncExternalStore } from "react"

import { formatDate, type DateVariant } from "@/lib/format"

const subscribe = () => () => {}

/**
 * Renders an instant in the viewer's timezone. The server has no idea what that
 * is, so dates fall back to UTC and times stay blank until the client hydrates.
 */
export function LocalTime({
  iso,
  variant = "datetime",
  className,
}: {
  iso: string
  variant?: DateVariant
  className?: string
}) {
  const text = useSyncExternalStore(
    subscribe,
    () => formatDate(iso, variant),
    () => (variant === "date" ? formatDate(iso, variant, "UTC") : "")
  )

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {text || " "}
    </time>
  )
}
