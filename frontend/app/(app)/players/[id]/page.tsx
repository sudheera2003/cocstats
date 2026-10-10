import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  CrosshairIcon,
  PercentIcon,
  StarIcon,
  SwordsIcon,
  TimerIcon,
  ZapIcon,
} from "lucide-react"

import {
  EnemyTownHall,
  RoleBadge,
  TownHallBadge,
  WarTypeBadge,
} from "@/components/badges"
import { StarsChart } from "@/components/charts/stars-chart"
import { TrendChart } from "@/components/charts/trend-chart"
import { FilterTabs } from "@/components/filter-tabs"
import { LocalTime } from "@/components/local-time"
import { PageShell } from "@/components/page-shell"
import { PlayerAvatar } from "@/components/player-avatar"
import { BreakdownTable } from "@/components/players/breakdown-table"
import { PlayerProfile } from "@/components/players/player-profile"
import { TypeComparison } from "@/components/players/type-comparison"
import { StatCard } from "@/components/stat-card"
import { Stars } from "@/components/stars"
import { Badge } from "@/components/ui/badge"
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
import { getPlayer, getPlayerProfile, getWars } from "@/lib/data"
import { comparePlayerByType } from "@/lib/compare"
import { parseStatsFilter, STATS_FILTER_OPTIONS } from "@/lib/filters"
import {
  formatDuration,
  formatNumber,
  formatPercent,
  formatRate,
  pluralize,
} from "@/lib/format"
import {
  averageTownHallDiff,
  breakdownByMatchup,
  breakdownByOrder,
  rowMatchup,
  breakdownByTargetTownHall,
  computePlayerStats,
  filterWars,
  flattenAttacks,
  groupBy,
  summarize,
  type Matchup,
} from "@/lib/stats"

export const metadata: Metadata = { title: "Player" }

const MATCHUP_LABELS: Record<Matchup, string> = {
  up: "Hitting up",
  same: "Mirror",
  down: "Hitting down",
}

function RangeRow({
  label,
  min,
  avg,
  max,
}: {
  label: string
  min: string
  avg: string
  max: string
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-right tabular-nums">{min}</TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {avg}
      </TableCell>
      <TableCell className="text-right tabular-nums">{max}</TableCell>
    </TableRow>
  )
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string | string[] }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const type = parseStatsFilter(query.type)
  const [player, allWars] = await Promise.all([getPlayer(id), getWars()])
  if (!player) notFound()
  // Only someone still in the clan is sure to have a profile worth the extra call.
  const profile = player.active ? await getPlayerProfile(player.id) : null

  const wars = filterWars(allWars, type)
  const stats = computePlayerStats([player.id], wars).get(player.id)!
  const myRows = (wars_: typeof wars) =>
    flattenAttacks(wars_).filter((row) => row.playerId === player.id)
  const rows = myRows(wars)

  const history = [...rows].sort(
    (a, b) =>
      Date.parse(b.warStartedAt) - Date.parse(a.warStartedAt) ||
      b.sequence - a.sequence
  )
  const trend = [...groupBy(rows, (row) => row.warId)]
    .map(([warId, group]) => {
      const summary = summarize(group)
      return {
        id: warId,
        date: group[0].warStartedAt,
        opponent: group[0].warOpponent,
        destruction: summary.avgDestruction,
        stars: summary.avgStars,
      }
    })
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .slice(-15)

  const comparison = comparePlayerByType(player.id, allWars)
  const orderRows = breakdownByOrder(rows).map(({ key, summary }) => ({
    label: key,
    summary,
  }))
  const byMatchup = breakdownByMatchup(rows)
  const matchupRows = (["up", "same", "down"] as Matchup[]).flatMap((m) =>
    byMatchup.has(m)
      ? [{ label: MATCHUP_LABELS[m], summary: byMatchup.get(m)! }]
      : []
  )

  const townHallRows = breakdownByTargetTownHall(rows).map(
    ({ townHall, summary }) => ({ label: `TH${townHall}`, summary })
  )
  const avgDiff = averageTownHallDiff(rows)

  return (
    <PageShell
      crumbs={[{ label: "Players", href: "/players" }, { label: player.name }]}
      title={
        <span className="flex flex-wrap items-center gap-2">
          <PlayerAvatar name={player.name} size="lg" className="mr-1" />
          {player.name}
          <TownHallBadge level={player.townHall} />
          <RoleBadge role={player.role} />
          {!player.active && <Badge variant="outline">Left clan</Badge>}
        </span>
      }
      description={
        <>
          <span className="font-mono">{player.tag}</span>
          {player.league && ` · ${player.league.name}`}
        </>
      }
    >
      {profile && <PlayerProfile profile={profile} />}

      <TypeComparison columns={comparison} />

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">Details below for</span>
        <FilterTabs
          param="type"
          value={type}
          options={STATS_FILTER_OPTIONS}
          defaultValue="overall"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Avg stars"
          icon={StarIcon}
          tone="gold"
          value={formatNumber(stats.avgStars)}
          hint={`${stats.totalStars} total · ${formatNumber(stats.starsPerWar)} per war`}
        />
        <StatCard
          label="Avg destruction"
          icon={PercentIcon}
          tone="sky"
          value={formatPercent(stats.avgDestruction)}
          hint={`Across ${pluralize(stats.attacks, "attack")}`}
        />
        <StatCard
          label="3-star rate"
          icon={ZapIcon}
          tone="violet"
          value={formatRate(stats.threeStarRate)}
          hint={`${stats.threeStars} triples · ${stats.zeroStars} zero-stars`}
        />
        <StatCard
          label="Wars"
          icon={SwordsIcon}
          value={stats.wars}
          hint={pluralize(stats.attacks, "attack")}
        />
        <StatCard
          label="Attacks used"
          icon={CrosshairIcon}
          tone={stats.missed > 0 ? "rose" : "neutral"}
          value={formatRate(stats.usageRate)}
          hint={`${pluralize(stats.missed, "missed attack")}`}
        />
        <StatCard
          label="Avg battle time"
          icon={TimerIcon}
          value={formatDuration(stats.avgDuration)}
          hint={`Fastest 3★ ${formatDuration(stats.fastestThreeStar)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lowest · average · highest</CardTitle>
            <CardDescription>
              The range of this player&apos;s attacks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Avg</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <RangeRow
                  label="Stars"
                  min={formatNumber(stats.minStars, 0)}
                  avg={formatNumber(stats.avgStars)}
                  max={formatNumber(stats.maxStars, 0)}
                />
                <RangeRow
                  label="Destruction"
                  min={formatPercent(stats.minDestruction, 0)}
                  avg={formatPercent(stats.avgDestruction)}
                  max={formatPercent(stats.maxDestruction, 0)}
                />
                <RangeRow
                  label="Battle time"
                  min={formatDuration(stats.minDuration)}
                  avg={formatDuration(stats.avgDuration)}
                  max={formatDuration(stats.maxDuration)}
                />
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Star distribution</CardTitle>
            <CardDescription>Attacks by stars earned.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.attacks > 0 ? (
              <StarsChart distribution={stats.distribution} />
            ) : (
              <p className="py-16 text-center text-xs text-muted-foreground">
                No attacks yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form</CardTitle>
          <CardDescription>
            Average destruction and stars per attack in each war the game still
            shares in full.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trend.length > 0 ? (
            <TrendChart data={trend} />
          ) : (
            <p className="py-16 text-center text-xs text-muted-foreground">
              {player.name} hasn&apos;t attacked in the current war or this CWL
              season.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>By attack number</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownTable
              title="Attack"
              rows={orderRows}
              empty="No attacks yet."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By matchup</CardTitle>
            <CardDescription>
              Whether the base sat above, level with or below this player on the
              war map (a weak enemy clan doesn&apos;t count against top players)
              {avgDiff !== null &&
                `. In Town Hall terms they typically hit ${
                  Math.abs(avgDiff) < 0.05
                    ? "the same level"
                    : `${Math.abs(avgDiff).toFixed(1)} ${
                        avgDiff > 0 ? "above" : "below"
                      }`
                }`}
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownTable
              title="Matchup"
              rows={matchupRows}
              empty="No attacks yet."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By enemy Town Hall</CardTitle>
            <CardDescription>
              How this player does against each Town Hall level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownTable
              title="Enemy"
              rows={townHallRows}
              empty="No attacks yet."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attack history</CardTitle>
          <CardDescription>
            {pluralize(history.length, "attack")}, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No attacks yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Battle day</TableHead>
                  <TableHead>War</TableHead>
                  <TableHead className="text-right">Attack</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead>Enemy TH</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Destruction</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <LocalTime iso={row.warStartedAt} variant="date" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/wars/${row.warId}`}
                          className="font-medium hover:underline"
                        >
                          vs {row.warOpponent}
                        </Link>
                        <WarTypeBadge type={row.warType} day={row.warDay} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.order}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      #{row.targetPosition}
                    </TableCell>
                    <TableCell>
                      <EnemyTownHall
                        direction={rowMatchup(row).direction}
                        enemy={row.targetTownHall}
                      />
                    </TableCell>
                    <TableCell>
                      <Stars value={row.stars} />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {row.destruction}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDuration(row.durationSec)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
