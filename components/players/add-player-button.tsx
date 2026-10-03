"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { PlayerDialog } from "@/components/players/player-dialog"
import { Button } from "@/components/ui/button"

export function AddPlayerButton({
  variant = "default",
}: {
  variant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <PlusIcon /> Add player
      </Button>
      <PlayerDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
