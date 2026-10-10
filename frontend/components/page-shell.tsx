import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Fragment } from "react"

export interface Crumb {
  label: string
  href?: string
}

export function PageShell({
  crumbs,
  title,
  description,
  actions,
  children,
}: {
  crumbs: Crumb[]
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-1 data-vertical:h-4 data-vertical:self-center"
        />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            {crumbs.map((crumb, index) => (
              <Fragment key={crumb.label}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      {/* A faint wash of the brand colour behind the page title. */}
      <div className="flex flex-1 flex-col bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_7%,transparent),transparent_14rem)]">
        <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </h1>
              {description && (
                <p className="max-w-2xl text-xs/relaxed text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            )}
          </div>
          {children}
        </div>
      </div>
    </>
  )
}
