import { PageShell } from "@/components/page-shell"
import { FilterTabsSkeleton, TableSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function PlayersLoading() {
  return (
    <PageShell
      crumbs={[{ label: "Players" }]}
      title="Players"
      description="Everyone in your clan. Overall adds Regular and CWL wars together; friendly wars are practice and kept separate. Click a column to sort."
      actions={<Skeleton className="h-9 w-28 rounded-md" />}
    >
      <div className="flex">
        <FilterTabsSkeleton />
      </div>
      <TableSkeleton columns={7} rows={8} />
    </PageShell>
  )
}
