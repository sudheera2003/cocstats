export class CocApiError extends Error {
  constructor(
    /** HTTP status from the API, or 0 when it couldn't be reached at all. */
    readonly status: number,
    readonly reason: string,
    message: string
  ) {
    super(message)
    this.name = "CocApiError"
  }
}

export interface CocClient {
  /** GET a path under /v1, e.g. "/clans/%232PP0JCCL". */
  get<T>(path: string): Promise<T>
}

interface CacheEntry {
  value: unknown
  expiresAt: number
}

const DEFAULT_TTL_MS = 60_000
const MIN_TTL_MS = 15_000
const MAX_TTL_MS = 60 * 60_000
const REQUEST_TIMEOUT_MS = 10_000
const MAX_ENTRIES = 500

function ttlFrom(response: Response) {
  const maxAge = /max-age=(\d+)/.exec(
    response.headers.get("cache-control") ?? ""
  )
  if (!maxAge) return DEFAULT_TTL_MS
  return Math.min(MAX_TTL_MS, Math.max(MIN_TTL_MS, Number(maxAge[1]) * 1000))
}

async function toError(response: Response) {
  let reason = "unknown"
  let message = `Clash of Clans API answered ${response.status}`
  try {
    const body = (await response.json()) as {
      reason?: string
      message?: string
    }
    if (body.reason) reason = body.reason
    if (body.message) message = body.message
  } catch {
    // Not JSON (a gateway error page, say); the status is all we have.
  }
  return new CocApiError(response.status, reason, message)
}

/**
 * Talks to the Clash of Clans API. Answers are kept for as long as the API says
 * they stay fresh (its own data only updates every minute or two), identical
 * requests in flight share one call, and a stale answer is preferred over an
 * error when the API is down.
 */
export function createCocClient(options: {
  baseUrl: string
  token: string
  fetch?: typeof fetch
  now?: () => number
}): CocClient {
  const { baseUrl, token } = options
  const fetchImpl = options.fetch ?? fetch
  const now = options.now ?? Date.now
  const cache = new Map<string, CacheEntry>()
  const inFlight = new Map<string, Promise<unknown>>()

  function remember(path: string, entry: CacheEntry) {
    if (cache.size >= MAX_ENTRIES) {
      for (const [key, old] of cache) {
        if (old.expiresAt <= now()) cache.delete(key)
      }
    }
    cache.set(path, entry)
  }

  async function request(path: string) {
    const stale = cache.get(path)
    let response: Response
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (cause) {
      if (stale) return stale.value
      throw new CocApiError(
        0,
        "unreachable",
        `Couldn't reach the Clash of Clans API: ${cause instanceof Error ? cause.message : String(cause)}`
      )
    }
    if (!response.ok) {
      if (stale && response.status >= 500) return stale.value
      throw await toError(response)
    }
    const value: unknown = await response.json()
    remember(path, { value, expiresAt: now() + ttlFrom(response) })
    return value
  }

  return {
    get<T>(path: string) {
      const cached = cache.get(path)
      if (cached && cached.expiresAt > now()) {
        return Promise.resolve(cached.value as T)
      }
      let pending = inFlight.get(path)
      if (!pending) {
        pending = request(path).finally(() => inFlight.delete(path))
        inFlight.set(path, pending)
      }
      return pending as Promise<T>
    },
  }
}
