import type { Metadata } from "next"
import Link from "next/link"
import { SwordsIcon } from "lucide-react"

import { OutcomeBadge, WarTypeBadge } from "@/components/badges"
import { FilterTabs } from "@/components/filter-tabs"
import { LinkRow } from "@/components/link-row"
import { LocalTime } from "@/components/local-time"
import { PageShell } from "@/components/page-shell"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { WarLogNotice } from "@/components/wars/war-log-notice"
import { WarLogTable } from "@/components/wars/war-log-table"
import { WAR_TYPE_META } from "@/lib/constants"
import { getWarLog, getWars } from "@/lib/data"
import { parseWarListFilter, WAR_LIST_FILTER_OPTIONS } from "@/lib/filters"
import { formatPercent, pluralize } from "@/lib/format"
import { filterWars, warOutcome, warScore } from "@/lib/stats"

export const metadata: Metadata = { title: "Wars" }

export default async function WarsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>
}) {
  const type = parseWarListFilter((await searchParams).type)
  const [allWars, log] = await Promise.all([getWars(), getWarLog()])
  const wars = filterWars(allWars, type)
  const entries = log.entries.filter(
    (entry) => type === "all" || entry.type === type
  )

  return (
    <PageShell
      crumbs={[{ label: "Wars" }]}
      title="Wars"
      description="Straight from the game. Every attack is available for the current war and this CWL season; older wars only keep their final score."
    >
      {!log.isPublic && <WarLogNotice />}

      <div className="flex">
        <FilterTabs
          param="type"
          value={type}
          options={WAR_LIST_FILTER_OPTIONS}
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-sm font-medium">In detail</h2>
        {wars.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SwordsIcon />
              </EmptyMedia>
              <EmptyTitle>
                {allWars.length === 0
                  ? "Not in a war right now"
                  : "No wars of this type"}
              </EmptyTitle>
              <EmptyDescription>
                {allWars.length === 0
                  ? "The next war shows up here as soon as the clan is matched."
                  : "Try a different filter."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="@container rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden @3xl:table-cell">
                    Battle day
                  </TableHead>
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
                {wars.map((war) => {
                  const score = warScore(war)
                  return (
                    <LinkRow key={war.id} href={`/wars/${war.id}`}>
                      <TableCell className="hidden text-muted-foreground @3xl:table-cell">
                        <LocalTime iso={war.startedAt} variant="date" />
                      </TableCell>
                      {/* On a narrow table this column takes what's left and truncates. */}
                      <TableCell className="w-full max-w-0 @xl:w-auto @xl:max-w-none">
                        <Link
                          href={`/wars/${war.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {war.opponent}
                        </Link>
                        <div className="truncate text-[0.7rem] text-muted-foreground">
                          <span className="@xl:hidden">
                            {WAR_TYPE_META[war.type].short}
                            {war.day ? ` day ${war.day}` : ""} ·{" "}
                          </span>
                          <span className="hidden @md:inline">
                            {war.size} vs {war.size}
                          </span>
                          <span className="@3xl:hidden">
                            <span className="hidden @md:inline"> · </span>
                            <LocalTime iso={war.startedAt} variant="date" />
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden @xl:table-cell">
                        <WarTypeBadge type={war.type} day={war.day} />
                      </TableCell>
                      <TableCell>
                        <OutcomeBadge
                          outcome={warOutcome(war, score)}
                          preparing={war.phase === "preparation"}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="font-medium">{score.stars}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          – {war.opponentStars}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums @2xl:table-cell">
                        <span className="font-medium">
                          {formatPercent(score.destruction, 2)}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          – {formatPercent(war.opponentDestruction, 2)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums @md:table-cell">
                        {score.attacksUsed} / {score.attacksAvailable}
                      </TableCell>
                    </LinkRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {entries.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="font-heading text-sm font-medium">War log</h2>
            <p className="text-xs text-muted-foreground">
              The last {pluralize(entries.length, "result")} from the
              clan&apos;s war log, newest first.
            </p>
          </div>
          <WarLogTable entries={entries} />
        </section>
      )}
    </PageShell>
  )
}
