import { SwordsIcon } from "lucide-react"

import { ClanBadge } from "@/components/clan-badge"
import { getBackendStatus } from "@/lib/data"
import type { ClanDTO } from "@/lib/types"

/** What sits at the top of the sidebar: the clan once it's known, the app's name until then. */
export function SidebarBrand({ clan }: { clan?: ClanDTO }) {
  return (
    <>
      {clan ? (
        <ClanBadge src={clan.badge} name={clan.name} />
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <SwordsIcon className="size-4" />
        </div>
      )}
      <div className="grid flex-1 text-left leading-tight">
        <span className="truncate text-sm font-semibold">
          {clan?.name ?? "CoC Stats"}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {clan?.sample ? "Sample data" : "Clan war tracker"}
        </span>
      </div>
    </>
  )
}

export async function SidebarClan() {
  const status = await getBackendStatus()
  return <SidebarBrand clan={status.ok ? status.clan : undefined} />
}
