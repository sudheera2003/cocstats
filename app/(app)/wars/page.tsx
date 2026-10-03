import type { Metadata } from "next"
import Link from "next/link"
import { PlusIcon, SwordsIcon } from "lucide-react"

import { OutcomeBadge, WarTypeBadge } from "@/components/badges"
import { FilterTabs } from "@/components/filter-tabs"
import { LocalTime } from "@/components/local-time"
import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
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
import { getWars } from "@/lib/data"
import { parseWarListFilter, WAR_LIST_FILTER_OPTIONS } from "@/lib/filters"
import { formatPercent } from "@/lib/format"
import { filterWars, warOutcome, warScore } from "@/lib/stats"

export const metadata: Metadata = { title: "Wars" }

export default async function WarsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>
}) {
  const type = parseWarListFilter((await searchParams).type)
  const allWars = await getWars()
  const wars = filterWars(allWars, type)

  return (
    <PageShell
      crumbs={[{ label: "Wars" }]}
      title="Wars"
      description="Every war you've logged, newest first."
      actions={
        <Button asChild>
          <Link href="/wars/new">
            <PlusIcon /> New war
          </Link>
        </Button>
      }
    >
      {allWars.length > 0 && (
        <div className="flex">
          <FilterTabs
            param="type"
            value={type}
            options={WAR_LIST_FILTER_OPTIONS}
          />
        </div>
      )}

      {wars.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SwordsIcon />
            </EmptyMedia>
            <EmptyTitle>
              {allWars.length === 0 ? "No wars yet" : "No wars of this type"}
            </EmptyTitle>
            <EmptyDescription>
              {allWars.length === 0
                ? "Start a war, pick your roster, then log each attack as it happens."
                : "Try a different filter, or start a new war."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/wars/new">
                <PlusIcon /> New war
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead>Opponent</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">Stars</TableHead>
                <TableHead className="text-right">Destruction</TableHead>
                <TableHead className="text-right">Attacks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wars.map((war) => {
                const score = warScore(war)
                const hasOpponent =
                  war.opponentStars !== null && war.opponentDestruction !== null
                return (
                  <TableRow key={war.id}>
                    <TableCell className="text-muted-foreground">
                      <LocalTime iso={war.startedAt} variant="date" />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/wars/${war.id}`}
                        className="font-medium hover:underline"
                      >
                        {war.opponent}
                      </Link>
                      <div className="text-[0.7rem] text-muted-foreground">
                        {war.size} vs {war.size}
                      </div>
                    </TableCell>
                    <TableCell>
                      <WarTypeBadge type={war.type} day={war.day} />
                    </TableCell>
                    <TableCell>
                      <OutcomeBadge outcome={warOutcome(war, score)} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="font-medium">{score.stars}</span>
                      {hasOpponent && (
                        <span className="text-muted-foreground">
                          {" "}
                          – {war.opponentStars}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="font-medium">
                        {formatPercent(score.destruction, 2)}
                      </span>
                      {hasOpponent && (
                        <span className="text-muted-foreground">
                          {" "}
                          – {formatPercent(war.opponentDestruction, 2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {score.attacksUsed} / {score.attacksAvailable}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  )
}
