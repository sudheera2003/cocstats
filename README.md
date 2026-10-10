# CoC Stats

A Clash of Clans war tracker that reads your clan straight from the [official Clash of Clans API](https://developer.clashofclans.com): members, the current war, the Clan War League season and the war log. Averages, highs and lows are worked out for each player and for the clan. Nothing is typed in by hand and there is no database.

The repo is two apps that deploy separately:

| Folder      | What it is                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| `backend/`  | A small Express API. It holds the API key, calls Clash of Clans and returns tidy JSON for one clan.   |
| `frontend/` | The Next.js app (App Router, Tailwind CSS, [shadcn/ui](https://ui.shadcn.com)). It only talks to the backend. |

The split exists because a Clash of Clans API key only works from the IP addresses it was created for. The backend runs somewhere with fixed outbound addresses (Render), and the frontend can run anywhere.

## Run it locally

```bash
cd backend
npm install
npm run dev          # http://localhost:4000
```

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

`backend/.env` and `frontend/.env.local` hold the settings; copy them from the `.env.example` beside each.

Without an API key the backend can serve generated sample data: set `COC_MOCK=1` in `backend/.env`. The sidebar says "Sample data" while it's on. To see your real clan locally you need either a key that allows your own IP address, or simply point the local frontend at the hosted backend (`BACKEND_URL=https://<name>.onrender.com`).

### Backend settings

| Variable           | Purpose                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `CLAN_TAG`         | Your clan's tag. In a `.env` file leave the `#` off (or quote the value). Required.               |
| `COC_API_TOKEN`    | API key from developer.clashofclans.com. Required unless `COC_MOCK=1`.                             |
| `COC_MOCK`         | `1` serves sample data instead of calling the API.                                                |
| `COC_API_BASE_URL` | Where the API is reached. Defaults to `https://api.clashofclans.com/v1`.                          |
| `CORS_ORIGIN`      | Comma-separated browser origins allowed to call the backend. Any origin when unset.               |
| `PORT`             | Defaults to 4000. Render sets it itself.                                                          |

### Frontend settings

| Variable      | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| `BACKEND_URL` | Where the backend is running. Defaults to `http://localhost:4000`. |

## Deploy the backend to Render

1. Push the repo to GitHub and create a **Web Service** on Render from it. `render.yaml` describes the service, or set it up by hand:
   - Root directory: `backend`
   - Build command: `npm ci --include=dev && npm run build`
   - Start command: `npm start`
   - Health check path: `/health`
2. Set `CLAN_TAG` in the service's **Environment** tab and deploy.
3. Find the addresses the service calls out from: in the Render dashboard open the service, click **Connect** and look at the **Outbound** tab. Opening `https://<name>.onrender.com/api/ip` shows the one in use right now.
4. On [developer.clashofclans.com](https://developer.clashofclans.com) go to **My Account → Create New Key** and add every outbound address from step 3. Keys can't be edited afterwards; to change the addresses, create a new key.
5. Set the key as `COC_API_TOKEN` in the Environment tab. Render redeploys, and `https://<name>.onrender.com/api/clan` should now return your clan.

If the key doesn't allow the address the backend called from, the API says which address it saw, and the app shows that message instead of the dashboard.

A free Render service sleeps after a while without traffic and takes up to a minute to wake, so the first page load after a quiet spell is slow.

Then host the frontend wherever you like (Vercel works out of the box with `frontend` as the root directory) and set `BACKEND_URL` to the Render URL.

## Backend API

| Endpoint                | Returns                                                                          |
| ----------------------- | -------------------------------------------------------------------------------- |
| `GET /health`           | `{ ok: true }`                                                                   |
| `GET /api/ip`           | The backend's public outbound IP address                                         |
| `GET /api/clan`         | The clan: name, badge, level, war league, all-time war record                    |
| `GET /api/players`      | Current members, plus anyone else who appears in the wars below                  |
| `GET /api/players/:tag` | One player's profile (only players from the list above)                          |
| `GET /api/wars`         | The wars with every attack (current war + each CWL day) and the war log          |
| `GET /api/cwl`          | The current CWL season: registered roster and the group's standings              |

Errors come back as `{ "error": { "code", "message" } }`. Answers from Clash of Clans are cached for as long as the API says they stay fresh (a minute or two), so the pages can be reloaded freely.

## What the API does and doesn't share

- **Every attack** is available for the war in progress (from preparation day until the next war is found) and for each day of the current CWL season. Player stats, breakdowns, records and bonus medals are built from these wars.
- **Older wars** only survive in the war log, as a final score: result, stars, destruction and attacks used. The dashboard's win rate, form and trend come from there. A finished CWL season is logged as a single combined entry.
- **A private war log hides all of it.** The clan and its members still load, but the current war, the CWL season and the log need the war log set to public in the game's clan settings.
- Friendly wars can't be told apart from regular ones, and attacks have an order and a duration but no clock time.

Because there's no database, a war's attacks are gone once the game stops sharing them.

## How the numbers work

### Player stats

Each player's page opens with their profile from the game, then an **Overall stats** table: Overall (Regular + CWL) next to Regular and CWL. It covers wars, attacks, stars, average stars and destruction, 3-star rate, best and worst destruction, battle time, hit-ups, how far above or below their own Town Hall they usually attack, missed attacks and attack usage. The tabs under it filter the charts, breakdowns and attack history.

### Clan War League

A CWL season is a week: your clan is grouped with seven others and fights **one war per day against a different clan**, in 15v15 or 30v30, with **one attack per player per day**.

- **Standings:** clans are ranked by _league stars_, which are war stars plus 10 bonus stars for each day won, with total destruction (the sum of each day's destruction %) breaking ties. The CWL page shows the whole group's table, worked out from every war of the group.
- **Players:** days in the lineup, days benched, stars, averages and missed attacks for everyone registered.
- **Bonus medals:** everyone who attacked is ranked by how much they contributed, to help decide who deserves the leader's bonus medals. It's marked _Provisional_ until all seven days are done. Points come from stars, attacks used, missed attacks, **hit-ups**, how many positions above, stars earned on hit-ups, triples, and a small discount for stars on lower bases. Hover a score to see where it came from. The weights are in `frontend/lib/awards.ts`.

The 10-star win bonus comes from community documentation. If the game changes it, edit `CWL_WIN_BONUS_STARS` in `frontend/lib/constants.ts` and `backend/src/mappers.ts`.

### Hit-ups are judged by map position

An attack counts as hitting up, a mirror or hitting down by comparing the attacker's own position on the war map with the base they hit, not by Town Hall. Our #1 hitting their #1 is a mirror whatever the Town Halls are, so a weak enemy clan doesn't count against top players. Town Hall levels are still shown, and the "By enemy Town Hall" tables group by them.

### Rules worth knowing

- **War stars** are the best stars on each enemy base, not the sum of every attack. **War destruction** is the average of the best destruction on each base, with unattacked bases counting as 0.
- **Missed attacks** and attack usage only count wars that have ended.
- Averages across war types are weighted by attacks, never an average of averages.

## Scripts

Run these inside `backend/` or `frontend/`.

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the dev server                         |
| `npm run build`     | Production build                             |
| `npm start`         | Run the production build                     |
| `npm run test`      | Unit tests                                   |
| `npm run typecheck` | TypeScript check                             |
| `npm run lint`      | ESLint (frontend only)                       |

## Where things live

```
backend/src/
  index.ts        reads the settings and starts the server
  app.ts          routes and error responses
  service.ts      what to fetch for the clan, and how it fits together
  mappers.ts      Clash of Clans responses -> the shapes in types.ts
  coc/client.ts   the API client: key, caching, errors
  coc/mock.ts     sample data for COC_MOCK=1
frontend/
  app/            pages
  components/     UI, all shadcn
  lib/data.ts     calls the backend
  lib/stats.ts    the stats engine (with cwl.ts, awards.ts, compare.ts)
```

`backend/src/types.ts` and `frontend/lib/types.ts` describe the same JSON and are kept in step by hand.
