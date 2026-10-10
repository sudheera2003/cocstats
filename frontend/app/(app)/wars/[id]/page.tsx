import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CalendarIcon } from "lucide-react"

import { WarTypeBadge } from "@/components/badges"
import { ClanBadge } from "@/components/clan-badge"
import { LocalTime } from "@/components/local-time"
import { PageShell } from "@/components/page-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WarAttackLog } from "@/components/wars/war-attack-log"
import { WarBases } from "@/components/wars/war-bases"
import { WarRosterTable } from "@/components/wars/war-roster-table"
import { WarScoreboard } from "@/components/wars/war-scoreboard"
import { WAR_TYPE_META } from "@/lib/constants"
import { getClan, getWar } from "@/lib/data"
import { pluralize } from "@/lib/format"
import { warOutcome, warScore } from "@/lib/stats"
import type { WarDTO } from "@/lib/types"

export const metadata: Metadata = { title: "War" }

/** The next moment that matters: when battle day starts, or when the war ends. */
function WarClock({ war }: { war: WarDTO }) {
  const [label, iso] =
    war.phase === "preparation"
      ? ["Battle day starts", war.startedAt]
      : war.phase === "battle"
        ? ["Ends", war.endsAt]
        : ["Ended", war.endsAt]
  return (
    <span className="inline-flex items-center gap-1">
      <CalendarIcon aria-hidden className="size-3" />
      {label} <LocalTime iso={iso} />
    </span>
  )
}

export default async function WarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [war, clan] = await Promise.all([getWar(id), getClan()])
  if (!war) notFound()

  const score = warScore(war)
  const outcome = warOutcome(war, score)

  return (
    <PageShell
      crumbs={
        war.type === "cwl"
          ? [{ label: "CWL", href: "/cwl" }, { label: `Day ${war.day}` }]
          : [{ label: "Wars", href: "/wars" }, { label: `vs ${war.opponent}` }]
      }
      title={
        <span className="flex items-center gap-2">
          <ClanBadge src={war.opponentBadge} name={war.opponent} size="lg" />
          vs {war.opponent}
        </span>
      }
      description={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <WarTypeBadge type={war.type} day={war.day} />
          <span>
            {WAR_TYPE_META[war.type].label} · {war.size} vs {war.size} ·{" "}
            {pluralize(war.attacksPerMember, "attack")} each
          </span>
          <WarClock war={war} />
        </span>
      }
    >
      <WarScoreboard
        war={war}
        score={score}
        outcome={outcome}
        clanName={clan.name}
      />

      <Tabs defaultValue="roster" className="gap-4">
        <TabsList>
          <TabsTrigger value="roster">Roster ({war.roster.length})</TabsTrigger>
          <TabsTrigger value="log">
            Attack log ({war.attacks.length})
          </TabsTrigger>
          <TabsTrigger value="bases">Enemy bases</TabsTrigger>
        </TabsList>
        <TabsContent value="roster">
          <WarRosterTable war={war} />
        </TabsContent>
        <TabsContent value="log">
          <WarAttackLog war={war} />
        </TabsContent>
        <TabsContent value="bases">
          <WarBases war={war} score={score} />
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
