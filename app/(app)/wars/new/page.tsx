import type { Metadata } from "next"
import Link from "next/link"
import { UsersIcon } from "lucide-react"

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
import { NewWarForm } from "@/components/wars/new-war-form"
import { getPlayers } from "@/lib/data"

export const metadata: Metadata = { title: "New war" }

export default async function NewWarPage() {
  const players = (await getPlayers()).filter((player) => player.active)

  return (
    <PageShell
      crumbs={[{ label: "Wars", href: "/wars" }, { label: "New war" }]}
      title="New war"
      description="Set up the war, pick who's fighting, then log attacks as they happen."
    >
      {players.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>Add some players first</EmptyTitle>
            <EmptyDescription>
              A war needs a roster, and your roster is picked from your players.
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
        <NewWarForm players={players} />
      )}
    </PageShell>
  )
}
