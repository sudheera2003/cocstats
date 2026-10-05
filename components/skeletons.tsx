import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

/** Inline (span-based) skeleton, safe to nest inside a `<p>` — e.g. PageShell's `description`. */
export function TextSkeleton({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-3 w-40 animate-pulse rounded-md bg-muted align-middle",
        className
      )}
    />
  )
}

export function FilterTabsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-20 rounded-md" />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="size-3.5 rounded-sm" />
        </div>
        <Skeleton className="h-7 w-14" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  )
}

export function StatCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CardSkeleton({
  className,
  titleWidth = "w-32",
  descriptionWidth = "w-48",
  children,
}: {
  className?: string
  titleWidth?: string
  descriptionWidth?: string
  children: React.ReactNode
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className={cn("h-4", titleWidth)} />
        <Skeleton className={cn("h-3", descriptionWidth)} />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-64 w-full", className)} />
}

export function ListRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <div className="space-y-1.5 text-right">
            <Skeleton className="h-3.5 w-10" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function DlRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <dl className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </dl>
  )
}

export function TableSkeleton({
  columns,
  rows = 6,
  withBorder = true,
}: {
  columns: number
  rows?: number
  withBorder?: boolean
}) {
  const table = (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableCell key={i}>
              <Skeleton className="h-3 w-16" />
            </TableCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, r) => (
          <TableRow key={r}>
            {Array.from({ length: columns }).map((_, c) => (
              <TableCell key={c}>
                <Skeleton className="h-3.5 w-full max-w-24" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
  return withBorder ? <div className="rounded-lg border">{table}</div> : table
}

export function FormCardSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <Card>
      <CardContent className="space-y-5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-9 w-28 rounded-md" />
      </CardContent>
    </Card>
  )
}
