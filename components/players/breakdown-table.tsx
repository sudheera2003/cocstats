import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNumber, formatPercent, formatRate } from "@/lib/format"
import type { Summary } from "@/lib/stats"

export function BreakdownTable({
  title,
  rows,
  empty,
}: {
  title: string
  rows: { label: string; summary: Summary }[]
  empty: string
}) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">{empty}</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{title}</TableHead>
          <TableHead className="text-right">Attacks</TableHead>
          <TableHead className="text-right">Avg ★</TableHead>
          <TableHead className="text-right">Avg %</TableHead>
          <TableHead className="text-right">3★ rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ label, summary }) => (
          <TableRow key={label}>
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell className="text-right tabular-nums">
              {summary.attacks}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(summary.avgStars)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(summary.avgDestruction)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatRate(summary.threeStarRate)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
