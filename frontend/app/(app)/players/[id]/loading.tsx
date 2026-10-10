import { PageShell } from "@/components/page-shell"
import {
  CardSkeleton,
  ChartSkeleton,
  FilterTabsSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function PlayerLoading() {
  return (
    <PageShell
      crumbs={[{ label: "Players", href: "/players" }, { label: "…" }]}
      title={<Skeleton className="h-6 w-40" />}
    >
      <Skeleton className="h-16 w-full rounded-lg" />

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-3 w-28" />
        <FilterTabsSkeleton />
      </div>

      <StatCardsSkeleton count={6} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton titleWidth="w-44" descriptionWidth="w-56">
          <TableSkeleton columns={4} rows={3} withBorder={false} />
        </CardSkeleton>
        <CardSkeleton titleWidth="w-32">
          <ChartSkeleton />
        </CardSkeleton>
      </div>

      <CardSkeleton titleWidth="w-16" descriptionWidth="w-72">
        <ChartSkeleton />
      </CardSkeleton>

      <div className="grid gap-4 lg:grid-cols-3">
        <CardSkeleton titleWidth="w-28">
          <TableSkeleton columns={2} rows={4} withBorder={false} />
        </CardSkeleton>
        <CardSkeleton titleWidth="w-24" descriptionWidth="w-56">
          <TableSkeleton columns={2} rows={3} withBorder={false} />
        </CardSkeleton>
        <CardSkeleton titleWidth="w-36" descriptionWidth="w-56">
          <TableSkeleton columns={2} rows={4} withBorder={false} />
        </CardSkeleton>
      </div>

      <CardSkeleton titleWidth="w-28" descriptionWidth="w-24">
        <TableSkeleton columns={8} rows={6} withBorder={false} />
      </CardSkeleton>
    </PageShell>
  )
}
