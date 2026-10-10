import { EyeOffIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/** Explains the missing wars when the clan keeps its war log private. */
export function WarLogNotice() {
  return (
    <Alert>
      <EyeOffIcon />
      <AlertTitle>The clan&apos;s war log is private</AlertTitle>
      <AlertDescription>
        Clash of Clans only shares a clan&apos;s current war and past results
        when its war log is public. A leader or co-leader can switch it on in
        the game under clan settings.
      </AlertDescription>
    </Alert>
  )
}
