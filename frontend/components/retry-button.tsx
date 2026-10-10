"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { RotateCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

/** Asks the server for the page again, e.g. once the backend has woken up. */
export function RetryButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? <Spinner /> : <RotateCwIcon />} Try again
    </Button>
  )
}
