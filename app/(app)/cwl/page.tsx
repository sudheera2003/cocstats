import type { Metadata } from "next"
import Link from "next/link"
import { PlusIcon, TrophyIcon } from "lucide-react"

import { LocalTime } from "@/components/local-time"
import { PageShell } from "@/components/page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { CWL_DAYS, CWL_GROUP_SIZE } from "@/lib/constants"
import { computeSeasonStandings } from "@/lib/cwl"
import { getSeasons, getWars } from "@/lib/data"

export const metadata: Metadata = { title: "CWL" }

export default async function CwlPage() {
  const [seasons, wars] = await Promise.all([getSeasons(), getWars()])

  return (
    <PageShell
      crumbs={[{ label: "CWL" }]}
      title="Clan War League"
      description="Each season is seven daily wars against seven different clans."
      actions={
        <Button asChild>
          <Link href="/cwl/new">
            <PlusIcon /> New season
          </Link>
        </Button>
      }
    >
      {seasons.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrophyIcon />
            </EmptyMedia>
            <EmptyTitle>No CWL seasons yet</EmptyTitle>
            <EmptyDescription>
              Register your roster for the season, then start each day as it
              comes: who you face, who fights, and every attack.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/cwl/new">
                <PlusIcon /> New season
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {seasons.map((season) => {
            const standings = computeSeasonStandings(
              wars.filter((war) => war.seasonId === season.id)
            )
            const decided = standings.wins + standings.losses + standings.ties
            return (
              <li key={season.id}>
                <Link href={`/cwl/${season.id}`} className="block">
                  <Card className="h-full transition-colors hover:bg-muted/40">
                    <CardHeader>
                      <CardTitle className="flex flex-wrap items-center gap-2">
                        {season.name}
                        {season.league && (
                          <Badge variant="secondary">{season.league}</Badge>
                        )}
                        {season.finalRank !== null && (
                          <Badge variant="outline">
                            {season.finalRank} of {CWL_GROUP_SIZE}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {season.size} vs {season.size} · created{" "}
                        <LocalTime iso={season.createdAt} variant="date" />
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <div className="font-heading text-2xl font-semibold tabular-nums">
                            {standings.totalStars}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              league stars
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {decided > 0
                              ? `${standings.wins}W · ${standings.losses}L${standings.ties > 0 ? ` · ${standings.ties}T` : ""}`
                              : "No results yet"}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground tabular-nums">
                          Day {standings.played} of {CWL_DAYS}
                        </div>
                      </div>
                      <Progress
                        value={(standings.played / CWL_DAYS) * 100}
                        aria-label={`${standings.played} of ${CWL_DAYS} days started`}
                      />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </PageShell>
  )
}
