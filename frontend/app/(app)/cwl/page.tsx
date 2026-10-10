import type { Metadata } from "next"
import {
  CrosshairIcon,
  PercentIcon,
  StarIcon,
  SwordsIcon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react"

import { BonusMedals, type MedalRow } from "@/components/cwl/bonus-medals"
import { LeagueTable } from "@/components/cwl/league-table"
import { SeasonDays } from "@/components/cwl/season-days"
import { SeasonPlayersTable } from "@/components/cwl/season-players-table"
import { PageShell } from "@/components/page-shell"
import { BreakdownTable } from "@/components/players/breakdown-table"
import { StatCard } from "@/components/stat-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { AWARD_WEIGHTS, computeAwards } from "@/lib/awards"
import { CWL_DAYS, CWL_GROUP_SIZE, CWL_WIN_BONUS_STARS } from "@/lib/constants"
import { computeSeasonPlayers, computeSeasonStandings } from "@/lib/cwl"
import { getPlayers, getSeason, getWars } from "@/lib/data"
import {
  formatNumber,
  formatPercent,
  formatRate,
  pluralize,
} from "@/lib/format"
import {
  breakdownByMatchup,
  breakdownByTargetTownHall,
  flattenAttacks,
  type Matchup,
} from "@/lib/stats"

export const metadata: Metadata = { title: "CWL" }

const MATCHUP_LABELS: Record<Matchup, string> = {
  up: "Hitting up",
  same: "Mirror",
  down: "Hitting down",
}

export default async function CwlPage() {
  const [season, players, allWars] = await Promise.all([
    getSeason(),
    getPlayers(),
    getWars(),
  ])

  if (!season) {
    return (
      <PageShell
        crumbs={[{ label: "CWL" }]}
        title="Clan War League"
        description="Each season is seven daily wars against seven different clans."
      >
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrophyIcon />
            </EmptyMedia>
            <EmptyTitle>No CWL season right now</EmptyTitle>
            <EmptyDescription>
              The clan isn&apos;t in a Clan War League group at the moment. The
              season shows up here as soon as the clan signs up, and stays until
              the game clears it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </PageShell>
    )
  }

  const wars = allWars.filter((war) => war.seasonId === season.id)
  const standings = computeSeasonStandings(wars)
  const { summary } = standings
  const playerRows = computeSeasonPlayers(season.rosterIds, wars)

  const playersById = new Map(players.map((player) => [player.id, player]))
  const awards = computeAwards(season.rosterIds, wars)
  const medalRows: MedalRow[] = awards.ranked.flatMap((row) => {
    const player = playersById.get(row.playerId)
    return player
      ? [{ ...row, name: player.name, townHall: player.townHall }]
      : []
  })
  const noAttackNames = awards.noAttacks.flatMap(
    (id) => playersById.get(id)?.name ?? []
  )

  const rows = flattenAttacks(wars)
  const townHallRows = breakdownByTargetTownHall(rows).map(
    ({ townHall, summary: s }) => ({ label: `TH${townHall}`, summary: s })
  )
  const byMatchup = breakdownByMatchup(rows)
  const matchupRows = (["up", "same", "down"] as Matchup[]).flatMap((m) =>
    byMatchup.has(m)
      ? [{ label: MATCHUP_LABELS[m], summary: byMatchup.get(m)! }]
      : []
  )
  const record = `${standings.wins}W · ${standings.losses}L${standings.ties > 0 ? ` · ${standings.ties}T` : ""}`

  return (
    <PageShell
      crumbs={[{ label: "CWL" }]}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {season.name}
          {season.league && <Badge variant="secondary">{season.league}</Badge>}
          {season.rank !== null && (
            <Badge variant="outline">
              {season.state === "ended" ? "Finished " : "Currently "}
              {season.rank} of {CWL_GROUP_SIZE}
            </Badge>
          )}
        </span>
      }
      description={`${season.size} vs ${season.size} · ${standings.played} of ${CWL_DAYS} days drawn · ${pluralize(season.rosterIds.length, "player")} registered`}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="League stars"
          icon={TrophyIcon}
          tone="gold"
          value={standings.totalStars}
          hint={`${standings.warStars} war + ${standings.bonusStars} bonus`}
        />
        <StatCard
          label="Record"
          icon={SwordsIcon}
          tone="emerald"
          value={
            standings.wins + standings.losses + standings.ties > 0
              ? record
              : "—"
          }
          hint={`${standings.completed} of ${CWL_DAYS} days finished`}
        />
        <StatCard
          label="Total destruction"
          icon={PercentIcon}
          tone="sky"
          value={formatPercent(standings.totalDestruction, 1)}
          hint="Tiebreaker"
        />
        <StatCard
          label="Avg stars"
          icon={StarIcon}
          tone="gold"
          value={formatNumber(summary.avgStars)}
          hint={`${formatPercent(summary.avgDestruction)} destruction`}
        />
        <StatCard
          label="3-star rate"
          icon={ZapIcon}
          tone="violet"
          value={formatRate(summary.threeStarRate)}
          hint={`${summary.threeStars} triples`}
        />
        <StatCard
          label="Attacks"
          icon={CrosshairIcon}
          tone={standings.missed > 0 ? "rose" : "neutral"}
          value={summary.attacks}
          hint={pluralize(standings.missed, "missed attack")}
        />
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Clans are ranked by league stars: war stars plus {CWL_WIN_BONUS_STARS}{" "}
        bonus stars for each war won. Total destruction breaks ties.
      </p>

      <section className="space-y-3">
        <h2 className="font-heading text-sm font-medium">
          The {CWL_DAYS} days
        </h2>
        <SeasonDays days={standings.days} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-sm font-medium">Group standings</h2>
        <LeagueTable standings={season.standings} />
      </section>

      <BonusMedals
        rows={medalRows}
        noAttackNames={noAttackNames}
        wins={standings.wins}
        completed={standings.completed}
        totalDays={CWL_DAYS}
        weights={AWARD_WEIGHTS}
      />

      <section className="space-y-3">
        <h2 className="font-heading text-sm font-medium">Players</h2>
        <SeasonPlayersTable rows={playerRows} players={players} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By enemy Town Hall</CardTitle>
            <CardDescription>
              CWL matchmaking ignores Town Halls, so levels vary day to day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownTable
              title="Enemy"
              rows={townHallRows}
              empty="No attacks yet this season."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By matchup</CardTitle>
            <CardDescription>
              Whether the base sat above, level with or below the attacker on
              the war map, so a weak enemy clan doesn&apos;t count against top
              players.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownTable
              title="Matchup"
              rows={matchupRows}
              empty="No attacks yet this season."
            />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
