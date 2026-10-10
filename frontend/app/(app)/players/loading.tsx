import { PageShell } from "@/components/page-shell"
import { FilterTabsSkeleton, TableSkeleton } from "@/components/skeletons"

export default function PlayersLoading() {
  return (
    <PageShell
      crumbs={[{ label: "Players" }]}
      title="Players"
      description="Everyone in the clan, straight from the game. War stats cover the current war and this CWL season; Overall adds the two together. Click a column to sort."
    >
      <div className="flex">
        <FilterTabsSkeleton />
      </div>
      <TableSkeleton columns={7} rows={8} />
    </PageShell>
  )
}
