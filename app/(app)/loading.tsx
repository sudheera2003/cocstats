import { PageShell } from "@/components/page-shell"
import {
  CardSkeleton,
  ChartSkeleton,
  DlRowsSkeleton,
  FilterTabsSkeleton,
  ListRowsSkeleton,
  StatCardsSkeleton,
} from "@/components/skeletons"

export default function DashboardLoading() {
  return (
    <PageShell
      crumbs={[{ label: "Dashboard" }]}
      title="Dashboard"
      description="How your clan is doing. Overall counts Regular and CWL wars; friendly wars are practice and kept separate."
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
