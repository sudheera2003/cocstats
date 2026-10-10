"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

/** Tab strip that stores its selection in a URL search param so pages stay server-rendered. */
export function FilterTabs({
  param,
  value,
  options,
  defaultValue = "all",
}: {
  param: string
  value: string
  options: { value: string; label: string }[]
  defaultValue?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  function select(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (next === defaultValue) params.delete(param)
    else params.set(param, next)
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  return (
    <Tabs value={value} onValueChange={select}>
      <TabsList className={cn(pending && "opacity-70")}>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value}>
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
