import { PlugZapIcon } from "lucide-react"

import { PageShell } from "@/components/page-shell"
import { RetryButton } from "@/components/retry-button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const TITLES: Record<string, string> = {
  unreachable: "Can't reach the backend",
  not_configured: "The backend needs setting up",
  invalid_ip: "The API key doesn't allow the backend's address",
  access_denied: "The Clash of Clans API rejected the API key",
  not_found: "Clan not found",
  rate_limited: "The Clash of Clans API is busy",
  maintenance: "Clash of Clans is down for maintenance",
}

const HINTS: Record<string, string> = {
  unreachable:
    "Start the backend, or set BACKEND_URL to where it's hosted. A free Render service sleeps when idle and can take a minute to wake up.",
  not_configured:
    "Set it in the backend's environment (backend/.env locally, the Environment tab on Render), then restart the backend.",
}

/** Shown instead of the app when the backend can't serve the clan, saying what to fix. */
export function BackendNotice({
  code,
  message,
}: {
  code: string
  message: string
}) {
  return (
    <PageShell crumbs={[{ label: "Setup" }]} title="Almost there">
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PlugZapIcon />
          </EmptyMedia>
          <EmptyTitle>{TITLES[code] ?? "Couldn't load the clan"}</EmptyTitle>
          <EmptyDescription>{message}</EmptyDescription>
          {HINTS[code] && <EmptyDescription>{HINTS[code]}</EmptyDescription>}
        </EmptyHeader>
        <EmptyContent>
          <RetryButton />
        </EmptyContent>
      </Empty>
    </PageShell>
  )
}
