import Link from "next/link"
import {
  ArrowRightIcon,
  CircleOffIcon,
  CrosshairIcon,
  CrownIcon,
  FlameIcon,
  HourglassIcon,
  PercentIcon,
  StarIcon,
  TimerIcon,
  TrophyIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"

import { OutcomeBadge, WarTypeBadge } from "@/components/badges"
import { StarsChart } from "@/components/charts/stars-chart"
import { TrendChart } from "@/components/charts/trend-chart"
import { ClanBadge } from "@/components/clan-badge"
import { FilterTabs } from "@/components/filter-tabs"
import { LocalTime } from "@/components/local-time"
import { PageShell } from "@/components/page-shell"
import { PlayerAvatar } from "@/components/player-avatar"
import { ResultStrip } from "@/components/result-strip"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LiveWarCard } from "@/components/wars/live-war-card"
import { WarLogNotice } from "@/components/wars/war-log-notice"
import { getClan, getPlayers, getWarLog, getWars } from "@/lib/data"
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
} from "@/lib/stats"
import { cn } from "@/lib/utils"

const TREND_LENGTH = 15
const FORM_LENGTH = 5

// Gold, silver, bronze for the podium; everyone else is plain.
const RANK_STYLES = [
  "bg-amber-400/20 text-amber-700 dark:text-amber-300",
  "bg-zinc-400/25 text-zinc-600 dark:text-zinc-300",
  "bg-orange-600/20 text-orange-800 dark:text-orange-400",
]

function PlayerLink({ id, name }: { id: string; name: string }) {
  return (
    <Link href={`/players/${id}`} className="font-medium hover:underline">
      {name}
    </Link>
  )
}

function RecordRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <span
          aria-hidden
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted"
        >
          <Icon className="size-3.5" />
        </span>
        {label}
      </dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>
}) {
  const type = parseStatsFilter((await searchParams).type)
  const [clan, players, allWars, log] = await Promise.all([
    getClan(),
    getPlayers(),
    getWars(),
    getWarLog(),
  ])

  // Attack stats come from the wars the game still shares in full.
  const wars = filterWars(allWars, type)
  const stats = computeClanStats(wars)
  const { summary } = stats
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
  const liveWars = allWars.filter((war) => war.status === "ongoing")

  // Results come from the war log. A CWL season is logged as one lump, so the
  // war-by-war views stick to regular wars.
  const results = log.entries.filter((entry) => entry.type === "regular")
  // The log is newest first; the chart and the strip read oldest to newest.
  const trend = results
    .slice(0, TREND_LENGTH)
    .reverse()
    .map((entry) => ({
      id: entry.id,
      date: entry.endedAt,
      opponent: entry.opponent ?? "Unknown clan",
      destruction: entry.destruction,
      stars: entry.size > 0 ? entry.stars / entry.size : null,
    }))
  const form = results
    .flatMap((entry) => entry.result ?? [])
    .slice(0, FORM_LENGTH)
    .reverse()
  const recent = log.entries.slice(0, 5)

  // The all-time record is the clan's own; losses and ties are hidden along with a private war log.
  const decided = clan.warWins + (clan.warLosses ?? 0) + (clan.warTies ?? 0)
  const winRate =
    clan.warLosses !== null && decided > 0 ? clan.warWins / decided : null
  const record =
    clan.warLosses === null
      ? `${pluralize(clan.warWins, "win")} all-time`
      : `${clan.warWins}W · ${clan.warLosses}L${clan.warTies ? ` · ${clan.warTies}T` : ""}`

  return (
    <PageShell
      crumbs={[{ label: "Dashboard" }]}
      title={
        <span className="flex items-center gap-2">
          <ClanBadge src={clan.badge} name={clan.name} size="lg" />
          {clan.name}
        </span>
      }
      description={
        <>
          <span className="font-mono">{clan.tag}</span> · Level {clan.level} ·{" "}
          {pluralize(clan.memberCount, "member")}
          {clan.warLeague && ` · ${clan.warLeague}`}
        </>
      }
    >
      {!clan.warLogPublic && <WarLogNotice />}

      {liveWars.length > 0 && (
        <div className="grid gap-3">
          {liveWars.map((war) => (
            <LiveWarCard key={war.id} war={war} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <FilterTabs
          param="type"
          value={type}
          options={STATS_FILTER_OPTIONS}
          defaultValue="overall"
        />
        <span className="text-xs text-muted-foreground">
          Attack stats cover the current war and this CWL season, the wars the
          game shares in full.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Win rate"
          icon={TrophyIcon}
          tone="emerald"
          value={formatRate(winRate)}
          hint={
            <span className="flex items-center justify-between gap-2">
              <span className="truncate">{record}</span>
              {form.length > 0 && <ResultStrip outcomes={form} />}
            </span>
          }
        />
        <StatCard
          label="Win streak"
          icon={FlameIcon}
          value={clan.warWinStreak}
          hint={pluralize(clan.warWins, "war") + " won all-time"}
        />
        <StatCard
          label="Avg stars"
          icon={StarIcon}
          tone="gold"
          value={formatNumber(summary.avgStars)}
          hint={`${pluralize(summary.attacks, "attack")} in ${pluralize(stats.wars, "war")}`}
        />
        <StatCard
          label="Avg destruction"
          icon={PercentIcon}
          tone="sky"
          value={formatPercent(summary.avgDestruction)}
          hint={`Best ${formatPercent(summary.maxDestruction, 0)} · worst ${formatPercent(summary.minDestruction, 0)}`}
        />
        <StatCard
          label="3-star rate"
          icon={ZapIcon}
          tone="violet"
          value={formatRate(summary.threeStarRate)}
          hint={`${summary.threeStars} triples · avg ${formatDuration(summary.avgDuration)}`}
        />
        <StatCard
          label="Attacks used"
          icon={CrosshairIcon}
          tone={stats.missed > 0 ? "rose" : "neutral"}
          value={formatRate(stats.usageRate)}
          hint={`${pluralize(stats.missed, "missed attack")}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>War trend</CardTitle>
            <CardDescription>
              Destruction and stars per base in the last {TREND_LENGTH} regular
              wars.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trend.length > 0 ? (
              <TrendChart data={trend} starsLabel="Stars per base" />
            ) : (
              <p className="py-16 text-center text-xs text-muted-foreground">
                {log.isPublic
                  ? "No finished wars in the war log yet."
                  : "Needs a public war log."}
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
                No attacks yet.
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
                {topPerformers.map(({ player, stats: own }, index) => (
                  <li
                    key={player.id}
                    className="flex items-center gap-3 py-2 text-xs"
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-semibold tabular-nums",
                        RANK_STYLES[index] ?? "text-muted-foreground"
                      )}
                    >
                      {index + 1}
                    </span>
                    <PlayerAvatar name={player.name} size="default" />
                    <div className="min-w-0 flex-1">
                      <PlayerLink id={player.id} name={player.name} />
                      <div className="truncate text-[0.7rem] text-muted-foreground">
                        {pluralize(own.attacks, "attack")} ·{" "}
                        {formatRate(own.threeStarRate)} triples
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 font-medium tabular-nums">
                        {formatNumber(own.avgStars)}
                        <StarIcon
                          aria-label="stars"
                          className="size-3 fill-amber-400 text-amber-400"
                        />
                      </div>
                      <div className="text-[0.7rem] text-muted-foreground tabular-nums">
                        {formatPercent(own.avgDestruction)}
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
            <CardDescription>
              Best moments in the current war and CWL season.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-xs">
              <RecordRow icon={TrophyIcon} label="Best war">
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
              </RecordRow>
              <RecordRow icon={CrownIcon} label="Best single war">
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
              </RecordRow>
              <RecordRow icon={TimerIcon} label="Fastest 3-star">
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
              </RecordRow>
              <RecordRow icon={HourglassIcon} label="Longest attack">
                <span className="font-medium tabular-nums">
                  {formatDuration(summary.maxDuration)}
                </span>
              </RecordRow>
              <RecordRow icon={CircleOffIcon} label="Most missed attacks">
                {mostMissed[0] ? (
                  <>
                    <PlayerLink
                      id={mostMissed[0].player.id}
                      name={mostMissed[0].player.name}
                    />{" "}
                    <span className="font-medium text-rose-600 tabular-nums dark:text-rose-400">
                      {mostMissed[0].stats.missed}
                    </span>
                  </>
                ) : (
                  "None"
                )}
              </RecordRow>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent wars</CardTitle>
          <CardDescription>
            The latest results from the clan&apos;s war log.
          </CardDescription>
          <CardAction>
            <Button asChild variant="ghost" size="sm">
              <Link href="/wars">
                All wars <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              {log.isPublic
                ? "No finished wars in the war log yet."
                : "Needs a public war log."}
            </p>
          ) : (
            <ul>
              {recent.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 py-2 text-xs"
                >
                  <span className="w-18 shrink-0">
                    {entry.result ? (
                      <OutcomeBadge outcome={entry.result} />
                    ) : (
                      <WarTypeBadge type={entry.type} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {entry.opponent
                      ? `vs ${entry.opponent}`
                      : "Clan War League season"}
                  </span>
                  <span className="w-20 text-right tabular-nums">
                    <span className="font-medium">{entry.stars}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      – {entry.opponentStars}
                    </span>{" "}
                    ★
                  </span>
                  <span className="hidden w-16 text-right text-muted-foreground tabular-nums sm:block">
                    {formatPercent(entry.destruction)}
                  </span>
                  <LocalTime
                    iso={entry.endedAt}
                    variant="date"
                    className="hidden w-24 text-right text-muted-foreground md:block"
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
