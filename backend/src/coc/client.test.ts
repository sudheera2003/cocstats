import { describe, expect, it, vi } from "vitest"

import { CocApiError, createCocClient } from "./client.js"

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "max-age=120",
    },
    ...init,
  })
}

function setUp(fetchImpl: typeof fetch) {
  let now = 0
  const client = createCocClient({
    baseUrl: "https://coc.test/v1",
    token: "secret",
    fetch: fetchImpl,
    now: () => now,
  })
  return { client, advance: (ms: number) => (now += ms) }
}

describe("createCocClient", () => {
  it("sends the key and keeps the answer for as long as the API allows", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => json({ name: "Us" }))
    const { client, advance } = setUp(fetchImpl)

    expect(await client.get("/clans/%232PP")).toEqual({ name: "Us" })
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://coc.test/v1/clans/%232PP",
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: "Bearer secret" }),
      })
    )

    advance(119_000)
    await client.get("/clans/%232PP")
    expect(fetchImpl).toHaveBeenCalledTimes(1)

    advance(2_000)
    await client.get("/clans/%232PP")
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it("shares one call between identical requests in flight", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => json({}))
    const { client } = setUp(fetchImpl)
    await Promise.all([client.get("/a"), client.get("/a"), client.get("/b")])
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it("reports the API's own reason for a refusal", async () => {
    const { client } = setUp(async () =>
      json(
        {
          reason: "accessDenied.invalidIp",
          message:
            "Invalid authorization: API key does not allow access from IP 1.2.3.4",
        },
        { status: 403 }
      )
    )
    await expect(client.get("/a")).rejects.toMatchObject({
      status: 403,
      reason: "accessDenied.invalidIp",
      message: expect.stringContaining("1.2.3.4"),
    })
  })

  it("serves the last good answer while the API is down", async () => {
    let up = true
    const { client, advance } = setUp(async () => {
      if (up) return json({ wars: 1 })
      throw new TypeError("fetch failed")
    })
    await client.get("/a")
    up = false
    advance(10 * 60_000)
    expect(await client.get("/a")).toEqual({ wars: 1 })
    await expect(client.get("/never-seen")).rejects.toBeInstanceOf(CocApiError)
  })
})
