import { PageShell } from "@/components/page-shell"
import {
  StatCardsSkeleton,
  TableSkeleton,
  TextSkeleton,
} from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function WarLoading() {
  return (
    <PageShell
      crumbs={[{ label: "Wars", href: "/wars" }, { label: "…" }]}
      title={<Skeleton className="h-6 w-48" />}
      description={<TextSkeleton className="w-56" />}
      actions={
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="size-9 rounded-md" />
        </div>
      }
    >
      <StatCardsSkeleton count={4} />

      <div className="space-y-4">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
        <TableSkeleton columns={6} rows={8} />
      </div>
    </PageShell>
  )
}
