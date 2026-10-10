import { PageShell } from "@/components/page-shell"
import { FilterTabsSkeleton, TableSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function WarsLoading() {
  return (
    <PageShell
      crumbs={[{ label: "Wars" }]}
      title="Wars"
      description="Straight from the game. Every attack is available for the current war and this CWL season; older wars only keep their final score."
    >
      <div className="flex">
        <FilterTabsSkeleton />
      </div>
      <section className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <TableSkeleton columns={7} rows={4} />
      </section>
      <section className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <TableSkeleton columns={7} rows={8} />
      </section>
    </PageShell>
  )
}
