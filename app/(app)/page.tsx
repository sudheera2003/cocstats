import Link from "next/link"
import {
  CrosshairIcon,
  PercentIcon,
  PlusIcon,
  StarIcon,
  SwordsIcon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react"

import { OutcomeBadge, WarTypeBadge } from "@/components/badges"
import { StarsChart } from "@/components/charts/stars-chart"
import { TrendChart } from "@/components/charts/trend-chart"
import { FilterTabs } from "@/components/filter-tabs"
import { LocalTime } from "@/components/local-time"
import { PageShell } from "@/components/page-shell"
import { StatCard } from "@/components/stat-card"
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
import { getPlayers, getWars } from "@/lib/data"
import { parseStatsFilter, STATS_FILTER_OPTIONS } from "@/lib/filters"
import {
  formatDuration,
  formatNumber,
  formatPercent,
  formatRate,
  pluralize,
} from "@/lib/format"
import {
  computeClanStats,
  computePlayerStats,
  computeRecords,
  filterWars,
  playersById,
  warOutcome,
  warScore,
} from "@/lib/stats"

const TREND_LENGTH = 15

function PlayerLink({ id, name }: { id: string; name: string }) {
  return (
    <Link href={`/players/${id}`} className="font-medium hover:underline">
      {name}
    </Link>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>
}) {
  const type = parseStatsFilter((await searchParams).type)
  const [players, allWars] = await Promise.all([getPlayers(), getWars()])

  if (players.length === 0 && allWars.length === 0) {
    return (
      <PageShell crumbs={[{ label: "Dashboard" }]} title="Dashboard">
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SwordsIcon />
            </EmptyMedia>
            <EmptyTitle>Welcome to CoC Stats</EmptyTitle>
            <EmptyDescription>
              Add your clan members, start a war, then log every attack&apos;s
              stars, destruction and time. Averages, highs and lows are worked
              out for you.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button asChild>
              <Link href="/players">Add players</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </PageShell>
    )
  }

  const wars = filterWars(allWars, type)
  const clan = computeClanStats(wars)
  const { summary } = clan
  const playerStats = computePlayerStats(
    players.map((p) => p.id),
    wars
  )
  const byId = playersById(players)
  const records = computeRecords(wars)

  const ranked = players.map((player) => ({
    player,
    stats: playerStats.get(player.id)!,
  }))
  const qualified = ranked.filter((r) => r.stats.attacks >= 2)
  const topPerformers = (
    qualified.length > 0
      ? qualified
      : ranked.filter((r) => r.stats.attacks >= 1)
  )
    .sort(
      (a, b) =>
        b.stats.avgStars! - a.stats.avgStars! ||
        b.stats.avgDestruction! - a.stats.avgDestruction!
    )
    .slice(0, 5)
  const mostMissed = ranked
    .filter((r) => r.stats.missed > 0)
    .sort((a, b) => b.stats.missed - a.stats.missed)
    .slice(0, 5)

  const trend = clan.trend
    .filter((point) => point.status === "ended" && point.avgStars !== null)
    .slice(-TREND_LENGTH)
    .map((point) => ({
      id: point.warId,
      date: point.date,
      opponent: point.label,
      destruction: point.destruction,
      stars: point.avgStars,
    }))
  const recentWars = wars.slice(0, 5)
  const record =
    clan.wins + clan.losses + clan.ties > 0
      ? `${clan.wins}W · ${clan.losses}L${clan.ties > 0 ? ` · ${clan.ties}T` : ""}`
      : "No results recorded"

  return (
    <PageShell
      crumbs={[{ label: "Dashboard" }]}
      title="Dashboard"
      description="How your clan is doing. Overall counts Regular and CWL wars; friendly wars are practice and kept separate."
      actions={
        <Button asChild>
          <Link href="/wars/new">
            <PlusIcon /> New war
          </Link>
        </Button>
      }
    >
      <div className="flex">
        <FilterTabs
          param="type"
          value={type}
          options={STATS_FILTER_OPTIONS}
          defaultValue="overall"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Wars"
          icon={SwordsIcon}
          value={clan.wars}
          hint={`${clan.endedWars} ended · ${clan.ongoingWars} ongoing`}
        />
        <StatCard
          label="Win rate"
          icon={TrophyIcon}
          value={formatRate(clan.winRate)}
          hint={record}
        />
        <StatCard
          label="Avg stars"
          icon={StarIcon}
          value={formatNumber(summary.avgStars)}
          hint={`${pluralize(summary.attacks, "attack")} logged`}
        />
        <StatCard
          label="Avg destruction"
          icon={PercentIcon}
          value={formatPercent(summary.avgDestruction)}
          hint={`Best ${formatPercent(summary.maxDestruction, 0)} · worst ${formatPercent(summary.minDestruction, 0)}`}
        />
        <StatCard
          label="3-star rate"
          icon={ZapIcon}
          value={formatRate(summary.threeStarRate)}
          hint={`${summary.threeStars} triples · avg ${formatDuration(summary.avgDuration)}`}
        />
        <StatCard
          label="Attacks used"
          icon={CrosshairIcon}
          value={formatRate(clan.usageRate)}
          hint={`${pluralize(clan.missed, "missed attack")}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>War trend</CardTitle>
            <CardDescription>
              Destruction and average stars per attack, last {TREND_LENGTH}{" "}
              wars.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trend.length > 0 ? (
              <TrendChart data={trend} />
            ) : (
              <p className="py-16 text-center text-xs text-muted-foreground">
                Log some attacks to see how your clan trends over time.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Star distribution</CardTitle>
            <CardDescription>Attacks by stars earned.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.attacks > 0 ? (
              <StarsChart distribution={summary.distribution} />
            ) : (
              <p className="py-16 text-center text-xs text-muted-foreground">
                No attacks logged yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top performers</CardTitle>
            <CardDescription>
              Highest average stars per attack
              {qualified.length > 0 ? ", minimum 2 attacks" : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Nobody has attacked yet.
              </p>
            ) : (
              <ol className="divide-y">
                {topPerformers.map(({ player, stats }, index) => (
                  <li
                    key={player.id}
                    className="flex items-center gap-3 py-2 text-xs"
                  >
                    <span className="w-4 text-center font-medium text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <PlayerLink id={player.id} name={player.name} />
                      <div className="text-[0.7rem] text-muted-foreground">
                        {pluralize(stats.attacks, "attack")} ·{" "}
                        {formatRate(stats.threeStarRate)} triples
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium tabular-nums">
                        {formatNumber(stats.avgStars)} ★
                      </div>
                      <div className="text-[0.7rem] text-muted-foreground tabular-nums">
                        {formatPercent(stats.avgDestruction)}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Records</CardTitle>
            <CardDescription>Best moments so far.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-xs">
              <div className="flex items-center justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Best war</dt>
                <dd className="text-right">
                  {records.bestWar ? (
                    <Link
                      href={`/wars/${records.bestWar.war.id}`}
                      className="font-medium hover:underline"
                    >
                      {records.bestWar.score.stars}★ ·{" "}
                      {formatPercent(records.bestWar.score.destruction, 2)} vs{" "}
                      {records.bestWar.war.opponent}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Best single war</dt>
                <dd className="text-right">
                  {records.bestPerformance ? (
                    <>
                      <PlayerLink
                        id={records.bestPerformance.playerId}
                        name={
                          byId.get(records.bestPerformance.playerId)?.name ??
                          "Unknown"
                        }
                      />{" "}
                      <span className="text-muted-foreground">
                        {records.bestPerformance.stars}★ vs{" "}
                        {records.bestPerformance.opponent}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Fastest 3-star</dt>
                <dd className="text-right">
                  {records.fastestThreeStar ? (
                    <>
                      <PlayerLink
                        id={records.fastestThreeStar.playerId}
                        name={
                          byId.get(records.fastestThreeStar.playerId)?.name ??
                          "Unknown"
                        }
                      />{" "}
                      <span className="text-muted-foreground tabular-nums">
                        {formatDuration(records.fastestThreeStar.durationSec)}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Longest attack</dt>
                <dd className="font-medium tabular-nums">
                  {formatDuration(summary.maxDuration)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Most missed attacks</dt>
                <dd className="text-right">
                  {mostMissed[0] ? (
                    <>
                      <PlayerLink
                        id={mostMissed[0].player.id}
                        name={mostMissed[0].player.name}
                      />{" "}
                      <span className="text-muted-foreground tabular-nums">
                        {mostMissed[0].stats.missed}
                      </span>
                    </>
                  ) : (
                    "None"
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent wars</CardTitle>
          <CardDescription>
            <Link href="/wars" className="underline-offset-4 hover:underline">
              See all wars
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentWars.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No wars of this type yet.
            </p>
          ) : (
            <ul className="divide-y">
              {recentWars.map((war) => {
                const score = warScore(war)
                return (
                  <li key={war.id}>
                    <Link
                      href={`/wars/${war.id}`}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-xs hover:bg-muted/40"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        vs {war.opponent}
                      </span>
                      <WarTypeBadge type={war.type} day={war.day} />
                      <OutcomeBadge outcome={warOutcome(war, score)} />
                      <span className="tabular-nums">
                        <span className="font-medium">{score.stars}★</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {formatPercent(score.destruction)}
                        </span>
                      </span>
                      <LocalTime
                        iso={war.startedAt}
                        variant="date"
                        className="w-24 text-right text-muted-foreground"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
