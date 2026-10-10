import cors from "cors"
import express, { type ErrorRequestHandler } from "express"

import { CocApiError } from "./coc/client.js"
import type { Service } from "./service.js"
import { normalizeTag } from "./tags.js"
import type { ApiErrorBody } from "./types.js"

/** An error the caller can act on, sent as `{ error: { code, message } }`. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message)
    this.name = "HttpError"
  }
}

function fromCocError(error: CocApiError): HttpError {
  if (
    error.status === 403 &&
    error.reason.startsWith("accessDenied.invalidIp")
  ) {
    return new HttpError(
      502,
      "invalid_ip",
      `${error.message}. Keys can't be edited, so create a new one that allows this address and set it as COC_API_TOKEN.`
    )
  }
  if (error.status === 403) {
    return new HttpError(
      502,
      "access_denied",
      `It answered "${error.message}". Check that COC_API_TOKEN holds a current key from developer.clashofclans.com.`
    )
  }
  if (error.status === 404) {
    return new HttpError(
      404,
      "not_found",
      "The Clash of Clans API doesn't know this clan tag. Check CLAN_TAG."
    )
  }
  if (error.status === 429) {
    return new HttpError(
      503,
      "rate_limited",
      "The Clash of Clans API is throttling requests. Try again in a moment."
    )
  }
  if (error.status === 503) {
    return new HttpError(
      503,
      "maintenance",
      "Clash of Clans is down for maintenance. Try again once the game is back."
    )
  }
  return new HttpError(502, "upstream_error", error.message)
}

async function outboundIp() {
  const sources = ["https://api.ipify.org", "https://checkip.amazonaws.com"]
  for (const source of sources) {
    try {
      const response = await fetch(source, {
        signal: AbortSignal.timeout(5000),
      })
      const ip = (await response.text()).trim()
      if (response.ok && /^[0-9a-f.:]+$/i.test(ip)) return ip
    } catch {
      // Try the next one.
    }
  }
  throw new HttpError(
    502,
    "ip_lookup_failed",
    "Couldn't work out this server's public IP address."
  )
}

export function createApp(options: {
  /** Null until the backend has a clan tag and an API key. */
  service: Service | null
  /** Why there's no service, shown to whoever calls the API. */
  setupMessage?: string
  corsOrigins?: string[] | null
}) {
  const app = express()
  app.disable("x-powered-by")
  app.use(cors({ origin: options.corsOrigins ?? true, methods: ["GET"] }))

  const service = () => {
    if (!options.service) {
      throw new HttpError(
        503,
        "not_configured",
        options.setupMessage ?? "The backend isn't configured yet."
      )
    }
    return options.service
  }

  app.get("/", (_req, res) => {
    res.json({ name: "cocstats-backend", ok: true })
  })

  app.get("/health", (_req, res) => {
    res.json({ ok: true })
  })

  // The address the Clash of Clans API sees this server calling from: the one
  // an API key has to allow.
  app.get("/api/ip", async (_req, res) => {
    res.json({ ip: await outboundIp() })
  })

  app.get("/api/clan", async (_req, res) => {
    res.json(await service().clan())
  })

  app.get("/api/players", async (_req, res) => {
    res.json(await service().players())
  })

  app.get("/api/players/:tag", async (req, res) => {
    const tag = normalizeTag(req.params.tag)
    const profile = tag ? await service().playerProfile(tag) : null
    if (!profile)
      throw new HttpError(404, "not_found", "No such player in this clan.")
    res.json(profile)
  })

  app.get("/api/wars", async (_req, res) => {
    res.json(await service().wars())
  })

  app.get("/api/cwl", async (_req, res) => {
    res.json({ season: await service().season() })
  })

  app.use((_req, _res, next) => {
    next(new HttpError(404, "not_found", "No such endpoint."))
  })

  const onError: ErrorRequestHandler = (error, req, res, _next) => {
    const known =
      error instanceof HttpError
        ? error
        : error instanceof CocApiError
          ? fromCocError(error)
          : new HttpError(
              500,
              "internal_error",
              "Something went wrong on the backend."
            )
    if (known.status >= 500) {
      console.error(`${req.method} ${req.path} -> ${known.code}:`, error)
    }
    const body: ApiErrorBody = {
      error: { code: known.code, message: known.message },
    }
    res.status(known.status).json(body)
  }
  app.use(onError)

  return app
}
