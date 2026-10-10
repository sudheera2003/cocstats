import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CompareColumn } from "@/lib/compare"
import {
  formatDuration,
  formatNumber,
  formatPercent,
  formatRate,
} from "@/lib/format"
import { cn } from "@/lib/utils"

interface Metric {
  label: string
  value: (column: CompareColumn) => string
}

const METRICS: Metric[] = [
  { label: "Wars", value: (c) => String(c.stats.wars) },
  { label: "Attacks", value: (c) => String(c.stats.attacks) },
  { label: "Stars", value: (c) => String(c.stats.totalStars) },
  { label: "Avg stars", value: (c) => formatNumber(c.stats.avgStars) },
  {
    label: "Avg destruction",
    value: (c) => formatPercent(c.stats.avgDestruction),
  },
  { label: "3-star rate", value: (c) => formatRate(c.stats.threeStarRate) },
  {
    label: "Best %",
    value: (c) => formatPercent(c.stats.maxDestruction, 0),
  },
  {
    label: "Worst %",
    value: (c) => formatPercent(c.stats.minDestruction, 0),
  },
  {
    label: "Avg battle time",
    value: (c) => formatDuration(c.stats.avgDuration),
  },
  {
    label: "Hit-ups",
    value: (c) =>
      c.matchups.hitUps > 0
        ? `${c.matchups.hitUps} (${c.matchups.hitUpStars}★)`
        : "0",
  },
  {
    label: "Enemy TH vs own",
    value: (c) => {
      const diff = c.avgTownHallDiff
      if (diff === null) return "—"
      if (Math.abs(diff) < 0.05) return "same"
      return `${diff > 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)}`
    },
  },
  { label: "Missed", value: (c) => String(c.stats.missed) },
  { label: "Attack usage", value: (c) => formatRate(c.stats.usageRate) },
]

/** Overall (Regular + CWL) beside each war type. */
export function TypeComparison({ columns }: { columns: CompareColumn[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall stats</CardTitle>
        <CardDescription>
          Regular and CWL wars added together, with each on its own beside it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stat</TableHead>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "text-right",
                    column.key === "overall" && "text-foreground"
                  )}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {METRICS.map((metric) => (
              <TableRow key={metric.label}>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {metric.label}
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn(
                      "text-right tabular-nums",
                      column.key === "overall" && "bg-muted/40 font-medium"
                    )}
                  >
                    {metric.value(column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
