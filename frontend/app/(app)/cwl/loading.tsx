import { PageShell } from "@/components/page-shell"
import {
  CardSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
  TextSkeleton,
} from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function CwlLoading() {
  return (
    <PageShell
      crumbs={[{ label: "CWL" }]}
      title={<Skeleton className="h-6 w-40" />}
      description={<TextSkeleton className="w-72" />}
    >
      <StatCardsSkeleton count={6} />

      <section className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <TableSkeleton columns={5} rows={8} />
      </section>

      <CardSkeleton titleWidth="w-24">
        <TableSkeleton columns={6} rows={5} withBorder={false} />
      </CardSkeleton>

      <section className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <TableSkeleton columns={7} rows={6} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton titleWidth="w-36" descriptionWidth="w-64">
          <TableSkeleton columns={2} rows={4} withBorder={false} />
        </CardSkeleton>
        <CardSkeleton titleWidth="w-24" descriptionWidth="w-56">
          <TableSkeleton columns={2} rows={3} withBorder={false} />
        </CardSkeleton>
      </div>
    </PageShell>
  )
}
