"use client"

import { useEffect } from "react"
import { CloudOffIcon, RotateCwIcon } from "lucide-react"

import { PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageShell crumbs={[{ label: "Error" }]} title="Something went wrong">
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CloudOffIcon />
          </EmptyMedia>
          <EmptyTitle>Couldn&apos;t load this page</EmptyTitle>
          <EmptyDescription>
            The backend didn&apos;t answer, or the Clash of Clans API is
            unavailable right now. It usually sorts itself out within a minute.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => retry()}>
            <RotateCwIcon /> Try again
          </Button>
        </EmptyContent>
      </Empty>
    </PageShell>
  )
}
