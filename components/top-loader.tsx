"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react"

/** Safety net in case a skeleton is somehow left in the DOM forever. */
const MAX_WAIT_MS = 15000

function isModifiedClick(event: MouseEvent) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
}

function hasSkeletons() {
  return document.querySelector('[data-slot="skeleton"]') !== null
}

function TopLoaderInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const waitRef = useRef<{
    observer: MutationObserver
    timeout: ReturnType<typeof setTimeout>
  } | null>(null)
  const currentKey = `${pathname}?${searchParams.toString()}`

  // Mirrors `currentKey` on every render, so the click listener (added once)
  // always sees the latest committed route instead of a stale closure — and
  // never `window.location`, which the router updates before React commits.
  const latestKeyRef = useRef(currentKey)
  useLayoutEffect(() => {
    latestKeyRef.current = currentKey
  })

  // Only updated once a navigation actually completes, so the effect below
  // can tell a real route change from a re-render with the same route.
  const committedKeyRef = useRef(currentKey)

  useEffect(() => {
    function start() {
      // A new navigation started while we were still waiting out the last
      // one's skeletons (e.g. clicking another link mid-load) — drop that wait.
      if (waitRef.current) {
        waitRef.current.observer.disconnect()
        clearTimeout(waitRef.current.timeout)
        waitRef.current = null
      }
      if (intervalRef.current) return
      setVisible(true)
      setProgress((p) => (p > 0 ? p : 8))
      intervalRef.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.1))
      }, 150)
    }

    function onClick(event: MouseEvent) {
      // Capture phase: runs before `<Link>`'s own handler, which calls
      // preventDefault() for every client-side navigation.
      if (isModifiedClick(event)) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest("a")
      if (!anchor || anchor.hasAttribute("download")) return
      if (anchor.target && anchor.target !== "_self") return

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#")) return

      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      const destKey = `${url.pathname}?${url.searchParams.toString()}`
      if (destKey === latestKeyRef.current) return
      start()
    }

    document.addEventListener("click", onClick, { capture: true })
    window.addEventListener("popstate", start)
    return () => {
      document.removeEventListener("click", onClick, { capture: true })
      window.removeEventListener("popstate", start)
    }
  }, [])

  // The route commits (this fires) as soon as a segment's `loading.tsx`
  // fallback is ready — well before the real data behind it streams in. Keep
  // the bar going until every skeleton actually clears out of the page.
  useEffect(() => {
    if (committedKeyRef.current === currentKey) return
    committedKeyRef.current = currentKey

    function finish() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setProgress(100)
      setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 200)
    }

    if (!hasSkeletons()) {
      finish()
      return
    }

    const observer = new MutationObserver(() => {
      if (!hasSkeletons()) {
        clearTimeout(timeout)
        waitRef.current = null
        finish()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    const timeout = setTimeout(() => {
      observer.disconnect()
      waitRef.current = null
      finish()
    }, MAX_WAIT_MS)
    waitRef.current = { observer, timeout }

    return () => {
      observer.disconnect()
      clearTimeout(timeout)
      waitRef.current = null
    }
  }, [currentKey])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (waitRef.current) {
        waitRef.current.observer.disconnect()
        clearTimeout(waitRef.current.timeout)
      }
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_var(--color-primary)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderInner />
    </Suspense>
  )
}
