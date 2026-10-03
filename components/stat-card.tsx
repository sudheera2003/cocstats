import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: LucideIcon
  className?: string
}) {
  return (
    <Card size="sm" className={className}>
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span className="text-xs font-medium">{label}</span>
          {Icon && <Icon className="size-3.5" aria-hidden />}
        </div>
        <div className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
        {hint && (
          <div
            className={cn("truncate text-xs text-muted-foreground")}
            title={typeof hint === "string" ? hint : undefined}
          >
            {hint}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
