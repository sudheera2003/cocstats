import { createApp } from "./app.js"
import { createCocClient } from "./coc/client.js"
import { createMockClient } from "./coc/mock.js"
import { config } from "./config.js"
import { createService, type Service } from "./service.js"

// Only used to give the mock clan a tag when none is configured.
const MOCK_CLAN_TAG = "#2PP0JCCL"

function setUp(): { service: Service | null; setupMessage?: string } {
  if (config.mock) {
    const clanTag = config.clanTag ?? MOCK_CLAN_TAG
    return {
      service: createService(createMockClient(clanTag), clanTag, {
        sample: true,
      }),
    }
  }
  if (!config.clanTag) {
    return {
      service: null,
      setupMessage: "CLAN_TAG is missing or isn't a valid clan tag.",
    }
  }
  if (!config.token) {
    return {
      service: null,
      setupMessage:
        "COC_API_TOKEN isn't set. Create a key at developer.clashofclans.com that allows this server's IP address (open /api/ip on the backend to see it).",
    }
  }
  const client = createCocClient({
    baseUrl: config.apiBaseUrl,
    token: config.token,
  })
  return { service: createService(client, config.clanTag) }
}

const { service, setupMessage } = setUp()
const app = createApp({
  service,
  setupMessage,
  corsOrigins: config.corsOrigins,
})

app.listen(config.port, () => {
  console.log(`cocstats backend listening on port ${config.port}`)
  if (config.mock) console.log("COC_MOCK=1: serving generated sample data")
  else if (setupMessage) console.warn(`Not ready: ${setupMessage}`)
  else console.log(`Clan ${config.clanTag} via ${config.apiBaseUrl}`)
})
