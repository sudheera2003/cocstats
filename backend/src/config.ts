import { existsSync } from "node:fs"

import { normalizeTag } from "./tags.js"

// Local development reads backend/.env; on Render the variables are set in the dashboard.
if (existsSync(".env")) process.loadEnvFile(".env")

const env = (name: string) => process.env[name]?.trim() || null

export const config = {
  port: Number(env("PORT")) || 4000,
  /** Null when CLAN_TAG is missing or isn't a valid tag. */
  clanTag: normalizeTag(env("CLAN_TAG")),
  token: env("COC_API_TOKEN"),
  apiBaseUrl: (
    env("COC_API_BASE_URL") ?? "https://api.clashofclans.com/v1"
  ).replace(/\/+$/, ""),
  mock: env("COC_MOCK") === "1",
  /** Null allows any origin. */
  corsOrigins:
    env("CORS_ORIGIN")
      ?.split(",")
      .map((origin) => origin.trim()) ?? null,
}

export type Config = typeof config
