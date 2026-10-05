import { PageShell } from "@/components/page-shell"
import { FilterTabsSkeleton, TableSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function WarsLoading() {
  return (
    <PageShell
      crumbs={[{ label: "Wars" }]}
      title="Wars"
      description="Every war you've logged, newest first."
      actions={<Skeleton className="h-9 w-24 rounded-md" />}
    >
      <div className="flex">
        <FilterTabsSkeleton count={4} />
      </div>
      <TableSkeleton columns={7} rows={8} />
    </PageShell>
  )
}
