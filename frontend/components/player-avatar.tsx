import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const TINTS = [
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
]

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  // Spread by code point so an emoji or accented letter isn't cut in half.
  const letters =
    words.length > 1
      ? [[...words[0]][0], [...words[1]][0]]
      : [...(words[0] ?? "?")].slice(0, 2)
  return letters.join("").toUpperCase()
}

function tint(name: string) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) >>> 0
  return TINTS[hash % TINTS.length]
}

/** Initials on a colour picked from the name, so a player looks the same everywhere. */
export function PlayerAvatar({
  name,
  size = "sm",
  className,
}: {
  name: string
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  return (
    <Avatar size={size} className={className} aria-hidden>
      <AvatarFallback
        className={cn(
          "font-medium",
          size === "sm" && "text-[0.625rem]",
          size === "default" && "text-xs",
          tint(name)
        )}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
