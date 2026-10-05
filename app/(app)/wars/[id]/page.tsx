import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { OutcomeBadge, WarTypeBadge } from "@/components/badges"
import { LocalTime } from "@/components/local-time"
import { PageShell } from "@/components/page-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WarAttackLog } from "@/components/wars/war-attack-log"
import { WarBases } from "@/components/wars/war-bases"
import { WarRosterTable } from "@/components/wars/war-roster-table"
import { WarScoreboard } from "@/components/wars/war-scoreboard"
import { WarToolbar } from "@/components/wars/war-toolbar"
import { WAR_TYPE_META } from "@/lib/constants"
import { getPlayers, getSeason, getWar } from "@/lib/data"
import { warOutcome, warScore } from "@/lib/stats"

export const metadata: Metadata = { title: "War" }

export default async function WarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [war, players] = await Promise.all([getWar(id), getPlayers()])
  if (!war) notFound()

  const season = war.seasonId ? await getSeason(war.seasonId) : null
  const pool = new Set(season?.rosterIds)
  const lineupPlayers = season
    ? players.filter((player) => pool.has(player.id))
    : players

  const score = warScore(war)
  const outcome = warOutcome(war, score)

  return (
    <PageShell
      crumbs={
        season
          ? [
              { label: "CWL", href: "/cwl" },
              { label: season.name, href: `/cwl/${season.id}` },
              { label: `Day ${war.day}` },
            ]
          : [{ label: "Wars", href: "/wars" }, { label: `vs ${war.opponent}` }]
      }
      title={
        <span className="flex flex-wrap items-center gap-2">
          vs {war.opponent}
          <OutcomeBadge outcome={outcome} />
        </span>
      }
      description={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <WarTypeBadge type={war.type} day={war.day} />
          <span>
            {WAR_TYPE_META[war.type].label} · {war.size} vs {war.size} ·{" "}
            {war.attacksPerMember} attack{war.attacksPerMember === 1 ? "" : "s"}{" "}
            each
          </span>
          <span aria-hidden>·</span>
          <LocalTime iso={war.startedAt} />
        </span>
      }
      actions={
        <WarToolbar
          war={war}
          players={players}
          lineupPlayers={lineupPlayers}
          backHref={season ? `/cwl/${season.id}` : "/wars"}
        />
      }
    >
      <WarScoreboard war={war} score={score} />

      {war.notes && (
        <p className="rounded-lg border bg-muted/30 px-3 py-2 text-xs/relaxed text-muted-foreground">
          {war.notes}
        </p>
      )}

      <Tabs defaultValue="roster" className="gap-4">
        <TabsList>
          <TabsTrigger value="roster">Roster ({war.roster.length})</TabsTrigger>
          <TabsTrigger value="log">
            Attack log ({war.attacks.length})
          </TabsTrigger>
          <TabsTrigger value="bases">Enemy bases</TabsTrigger>
        </TabsList>
        <TabsContent value="roster">
          <WarRosterTable war={war} players={players} />
        </TabsContent>
        <TabsContent value="log">
          <WarAttackLog war={war} players={players} />
        </TabsContent>
        <TabsContent value="bases">
          <WarBases war={war} players={players} score={score} />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
