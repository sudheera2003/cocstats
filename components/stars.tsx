import { StarIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function Stars({
  value,
  max = 3,
  className,
}: {
  value: number
  max?: number
  className?: string
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value} of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => (
        <StarIcon
          key={i}
          aria-hidden
          className={cn(
            "size-3.5",
            i < value
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40"
          )}
        />
      ))}
    </span>
  )
}
