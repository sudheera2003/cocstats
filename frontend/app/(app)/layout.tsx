import { Suspense } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { BackendNotice } from "@/components/backend-notice"
import { PageShell } from "@/components/page-shell"
import { SidebarBrand, SidebarClan } from "@/components/sidebar-brand"
import { StatCardsSkeleton } from "@/components/skeletons"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { getBackendStatus } from "@/lib/data"

// Every page shows live data from the backend, so nothing here can be prerendered at build time.
export const dynamic = "force-dynamic"

/** Renders the page only once the backend can serve the clan; otherwise says what to fix. */
async function BackendGate({ children }: { children: React.ReactNode }) {
  const status = await getBackendStatus()
  if (!status.ok) {
    return <BackendNotice code={status.code} message={status.message} />
  }
  return children
}

function Connecting() {
  return (
    <PageShell
      crumbs={[{ label: "CoC Stats" }]}
      title={<Skeleton className="h-7 w-40" />}
    >
      <StatCardsSkeleton />
    </PageShell>
  )
}

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <AppSidebar
        brand={
          <Suspense fallback={<SidebarBrand />}>
            <SidebarClan />
          </Suspense>
        }
      />
      <SidebarInset className="min-w-0">
        <Suspense fallback={<Connecting />}>
          <BackendGate>{children}</BackendGate>
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
