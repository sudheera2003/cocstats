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
    // The 3-star column gives way first when the card is too narrow for five.
    <div className="@container">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{title}</TableHead>
            <TableHead className="text-right">Attacks</TableHead>
            <TableHead className="text-right">Avg ★</TableHead>
            <TableHead className="text-right">Avg %</TableHead>
            <TableHead className="hidden text-right @xs:table-cell">
              3★ rate
            </TableHead>
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
              <TableCell className="hidden text-right tabular-nums @xs:table-cell">
                {formatRate(summary.threeStarRate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
