import { ClanBadge } from "@/components/clan-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPercent } from "@/lib/format"
import type { SeasonStandingDTO } from "@/lib/types"
import { cn } from "@/lib/utils"

/** The eight clans of the CWL group, ranked the way the game ranks them. */
export function LeagueTable({ standings }: { standings: SeasonStandingDTO[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 text-right">#</TableHead>
            <TableHead>Clan</TableHead>
            <TableHead className="text-right">Record</TableHead>
            <TableHead className="text-right">Stars</TableHead>
            <TableHead className="text-right">Destruction</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((row) => (
            <TableRow
              key={row.tag}
              className={cn(row.isUs && "bg-primary/5 font-medium")}
            >
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {row.rank}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <ClanBadge src={row.badge} name={row.name} size="sm" />
                  <span className="truncate">{row.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.wins}W · {row.losses}L
                {row.ties > 0 ? ` · ${row.ties}T` : ""}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.stars}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPercent(row.destruction, 1)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
