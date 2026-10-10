import { PageShell } from "@/components/page-shell"
import {
  CardSkeleton,
  ChartSkeleton,
  DlRowsSkeleton,
  FilterTabsSkeleton,
  ListRowsSkeleton,
  StatCardsSkeleton,
  TextSkeleton,
} from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <PageShell
      crumbs={[{ label: "Dashboard" }]}
      title={<Skeleton className="h-7 w-48" />}
      description={<TextSkeleton className="w-72" />}
    >
      <div className="flex">
        <FilterTabsSkeleton />
      </div>

      <StatCardsSkeleton count={6} />

      <div className="grid gap-4 lg:grid-cols-3">
        <CardSkeleton className="lg:col-span-2" titleWidth="w-24">
          <ChartSkeleton />
        </CardSkeleton>
        <CardSkeleton titleWidth="w-32">
          <ChartSkeleton />
        </CardSkeleton>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton titleWidth="w-32">
          <ListRowsSkeleton rows={5} />
        </CardSkeleton>
        <CardSkeleton titleWidth="w-20">
          <DlRowsSkeleton rows={5} />
        </CardSkeleton>
      </div>

      <CardSkeleton titleWidth="w-28">
        <ListRowsSkeleton rows={5} />
      </CardSkeleton>
    </PageShell>
  )
}
