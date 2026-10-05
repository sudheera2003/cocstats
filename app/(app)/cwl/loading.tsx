import { PageShell } from "@/components/page-shell"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CwlLoading() {
  return (
    <PageShell
      crumbs={[{ label: "CWL" }]}
      title="Clan War League"
      description="Each season is seven daily wars against seven different clans."
      actions={<Skeleton className="h-9 w-32 rounded-md" />}
    >
      <ul className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i}>
            <Card className="h-full">
              <CardHeader>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </PageShell>
  )
}
