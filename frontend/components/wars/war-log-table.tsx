import { OutcomeBadge, WarTypeBadge } from "@/components/badges"
import { LocalTime } from "@/components/local-time"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPercent } from "@/lib/format"
import type { WarLogEntryDTO } from "@/lib/types"

/** Finished wars as the clan's war log has them: the score, but no individual attacks. */
export function WarLogTable({ entries }: { entries: WarLogEntryDTO[] }) {
  return (
    <div className="@container rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden @2xl:table-cell">Ended</TableHead>
            <TableHead>Opponent</TableHead>
            <TableHead className="hidden @xl:table-cell">Type</TableHead>
            <TableHead>Result</TableHead>
            <TableHead className="text-right">Stars</TableHead>
            <TableHead className="hidden text-right @2xl:table-cell">
              Destruction
            </TableHead>
            <TableHead className="hidden text-right @md:table-cell">
              Attacks
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="hidden text-muted-foreground @2xl:table-cell">
                <LocalTime iso={entry.endedAt} variant="date" />
              </TableCell>
              {/* On a narrow table this column takes what's left and truncates. */}
              <TableCell className="w-full max-w-0 @xl:w-auto @xl:max-w-none">
                <div className="truncate font-medium">
                  {entry.opponent ?? (
                    <span className="text-muted-foreground">
                      Clan War League season
                    </span>
                  )}
                </div>
                <div className="truncate text-[0.7rem] text-muted-foreground">
                  {entry.size} vs {entry.size}
                  <span className="@2xl:hidden">
                    {" · "}
                    <LocalTime iso={entry.endedAt} variant="date" />
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden @xl:table-cell">
                <WarTypeBadge type={entry.type} />
              </TableCell>
              <TableCell>
                {entry.result ? (
                  <OutcomeBadge outcome={entry.result} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="font-medium">{entry.stars}</span>
                <span className="text-muted-foreground">
                  {" "}
                  – {entry.opponentStars}
                </span>
              </TableCell>
              <TableCell className="hidden text-right tabular-nums @2xl:table-cell">
                <span className="font-medium">
                  {formatPercent(entry.destruction, 2)}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  – {formatPercent(entry.opponentDestruction, 2)}
                </span>
              </TableCell>
              <TableCell className="hidden text-right tabular-nums @md:table-cell">
                {entry.attacksUsed}
                {/* A season's entry adds up seven wars, so it has no single total. */}
                {entry.type === "regular" &&
                  ` / ${entry.size * entry.attacksPerMember}`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
