import { ShieldIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

/** A clan's badge as the game draws it, or a plain shield when there's no image. */
export function ClanBadge({
  src,
  name,
  size = "default",
  className,
}: {
  src: string | null
  name: string
  size?: "sm" | "default" | "lg"
  className?: string
}) {
  return (
    // Badges are shields, not portraits: no circle crop and no ring.
    <Avatar
      size={size}
      className={cn("rounded-none after:hidden", className)}
      aria-hidden
    >
      {src && (
        <AvatarImage
          src={src}
          alt={`${name} badge`}
          className="rounded-none object-contain"
        />
      )}
      <AvatarFallback className="rounded-md">
        <ShieldIcon className="size-1/2" />
      </AvatarFallback>
    </Avatar>
  )
}
