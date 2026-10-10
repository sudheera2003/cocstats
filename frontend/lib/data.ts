import "server-only"

import { cache } from "react"

import type {
  ClanDTO,
  PlayerDTO,
  PlayerProfileDTO,
  SeasonDTO,
  WarDTO,
  WarLogEntryDTO,
  WarsDTO,
} from "./types"

export const BACKEND_URL = (
  process.env.BACKEND_URL ?? "http://localhost:4000"
).replace(/\/+$/, "")

// A free Render service sleeps when idle and takes most of a minute to wake up.
const TIMEOUT_MS = 75_000

export class BackendError extends Error {
  constructor(
    /** The backend's error code, or "unreachable" when it never answered. */
    readonly code: string,
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = "BackendError"
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw new BackendError(
      "unreachable",
      0,
      `Couldn't reach the backend at ${BACKEND_URL}.`
    )
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string }
    } | null
    throw new BackendError(
      body?.error?.code ?? "backend_error",
      response.status,
      body?.error?.message ?? `The backend answered ${response.status}.`
    )
  }
  return (await response.json()) as T
}

// cache() shares one backend call between everything rendered for a request.
export const getClan = cache(() => request<ClanDTO>("/api/clan"))

export const getPlayers = cache(() => request<PlayerDTO[]>("/api/players"))

const getWarsBundle = cache(() => request<WarsDTO>("/api/wars"))

/** Wars with every attack: the current war and each day of the current CWL season. */
export async function getWars(): Promise<WarDTO[]> {
  return (await getWarsBundle()).wars
}

/** Finished wars as the clan's war log has them: scores, but no attacks. */
export async function getWarLog(): Promise<{
  entries: WarLogEntryDTO[]
  isPublic: boolean
}> {
  const { warLog, warLogPublic } = await getWarsBundle()
  return { entries: warLog, isPublic: warLogPublic }
}

/** The CWL season being played (or just finished), if there is one. */
export const getSeason = cache(
  async () => (await request<{ season: SeasonDTO | null }>("/api/cwl")).season
)

export async function getPlayer(id: string): Promise<PlayerDTO | null> {
  return (await getPlayers()).find((player) => player.id === id) ?? null
}

export async function getWar(id: string): Promise<WarDTO | null> {
  return (await getWars()).find((war) => war.id === id) ?? null
}

export async function getPlayerProfile(
  id: string
): Promise<PlayerProfileDTO | null> {
  try {
    return await request<PlayerProfileDTO>(
      `/api/players/${encodeURIComponent(id)}`
    )
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) return null
    throw error
  }
}

export type BackendStatus =
  { ok: true; clan: ClanDTO } | { ok: false; code: string; message: string }

/** Whether the backend can serve the clan. Never throws, so the layout can explain what's wrong. */
export const getBackendStatus = cache(async (): Promise<BackendStatus> => {
  try {
    return { ok: true, clan: await getClan() }
  } catch (error) {
    if (error instanceof BackendError) {
      return { ok: false, code: error.code, message: error.message }
    }
    throw error
  }
})
