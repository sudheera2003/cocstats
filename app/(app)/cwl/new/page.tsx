import type { Metadata } from "next"
import Link from "next/link"
import { UsersIcon } from "lucide-react"

import { NewSeasonForm } from "@/components/cwl/new-season-form"
import { PageShell } from "@/components/page-shell"
import { AddPlayerButton } from "@/components/players/add-player-button"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getPlayers } from "@/lib/data"

export const metadata: Metadata = { title: "New CWL season" }

export default async function NewSeasonPage() {
  const players = (await getPlayers()).filter((player) => player.active)
  const defaultName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date())

  return (
    <PageShell
      crumbs={[{ label: "CWL", href: "/cwl" }, { label: "New season" }]}
      title="New CWL season"
      description="Register your roster once. You'll pick each day's lineup from it."
    >
      {players.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>Add some players first</EmptyTitle>
            <EmptyDescription>
              A season roster is picked from your players.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <AddPlayerButton />
            <Button variant="outline" asChild>
              <Link href="/players">Go to players</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <NewSeasonForm players={players} defaultName={defaultName} />
      )}
    </PageShell>
  )
}
