"use client"

import { useRouter } from "next/navigation"

import { TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * A table row that opens `href` when clicked anywhere that isn't already a
 * control. The row should still contain a real link, for keyboards and new tabs.
 */
export function LinkRow({
  href,
  className,
  ...props
}: React.ComponentProps<typeof TableRow> & { href: string }) {
  const router = useRouter()

  return (
    <TableRow
      className={cn("cursor-pointer", className)}
      onClick={(event) => {
        const target = event.target as HTMLElement
        // Dialogs and menus are portalled out of the row but still bubble here.
        if (!event.currentTarget.contains(target)) return
        if (target.closest("a, button, input, [role='menuitem']")) return
        if (window.getSelection()?.toString()) return
        router.push(href)
      }}
      {...props}
    />
  )
}
