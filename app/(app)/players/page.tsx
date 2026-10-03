import type { Metadata } from "next"

import { FilterTabs } from "@/components/filter-tabs"
import { PageShell } from "@/components/page-shell"
import { AddPlayerButton } from "@/components/players/add-player-button"
import {
  PlayersTable,
  type PlayerRow,
} from "@/components/players/players-table"
import { getPlayers, getWars } from "@/lib/data"
import { parseStatsFilter, STATS_FILTER_OPTIONS } from "@/lib/filters"
import { computePlayerStats, filterWars } from "@/lib/stats"

export const metadata: Metadata = { title: "Players" }

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>
}) {
  const type = parseStatsFilter((await searchParams).type)
  const [players, wars] = await Promise.all([getPlayers(), getWars()])
  const stats = computePlayerStats(
    players.map((p) => p.id),
    filterWars(wars, type)
  )
  const ids = players.map((p) => p.id)
  const regular = computePlayerStats(ids, filterWars(wars, "regular"))
  const cwl = computePlayerStats(ids, filterWars(wars, "cwl"))
  const rows: PlayerRow[] = players.map((player) => ({
    player,
    stats: stats.get(player.id)!,
    split: {
      regular: regular.get(player.id)!.avgStars,
      cwl: cwl.get(player.id)!.avgStars,
    },
  }))

  return (
    <PageShell
      crumbs={[{ label: "Players" }]}
      title="Players"
      description="Everyone in your clan. Overall adds Regular and CWL wars together; friendly wars are practice and kept separate. Click a column to sort."
      actions={<AddPlayerButton />}
    >
      {players.length > 0 && (
        <div className="flex">
          <FilterTabs
            param="type"
            value={type}
            options={STATS_FILTER_OPTIONS}
            defaultValue="overall"
          />
        </div>
      )}
      <PlayersTable rows={rows} showSplit={type === "overall"} />
    </PageShell>
  )
}
