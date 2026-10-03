# CoC Stats

A Clash of Clans war tracker. Add your clan members, start a war, pick the roster, then log every attack's stars, destruction, battle time and target. Averages, highs and lows are worked out for each player and for the clan.

Built with Next.js (App Router), MongoDB, Tailwind CSS and [shadcn/ui](https://ui.shadcn.com). Every UI element is a shadcn component.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in MONGODB_URI
npm run dev
```

Open <http://localhost:3000>.

| Variable      | Purpose                                                         |
| ------------- | --------------------------------------------------------------- |
| `MONGODB_URI` | MongoDB connection string (Atlas or local). Required.           |
| `MONGODB_DB`  | Database name. Defaults to `cocstats`.                          |

Collections and indexes are created on first use.

## Scripts

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start the dev server            |
| `npm run build`     | Production build                |
| `npm run test`      | Unit tests for stats and rules  |
| `npm run typecheck` | TypeScript check                |
| `npm run lint`      | ESLint                          |

## How it works

**Players** have a name, optional player tag, Town Hall level and role. Players who have been in a war can't be deleted (it would rewrite history), so mark them inactive instead.

**Wars** are Regular or Friendly, with a size, attacks per member (1 or 2), a start time and a roster picked from your players. The Town Hall each player had at the time is stored with the war. Clan War League wars aren't created one by one, see below.

**Attacks** record the player, stars (0 to 3), destruction %, battle time (optional, max 3:00), when it happened, the enemy base number and the **enemy Town Hall** (required). Every attack on the same enemy base must agree on its Town Hall; the field fills itself in when you enter a base that's already been hit, and editing one attack's Town Hall updates the whole base. Impossible results are rejected: 100% is always 3 stars, 3 stars needs 100%, 50% or more earns at least 1 star, and 2 stars needs at least 50%.

### Player stats

Each player's page opens with an **Overall stats** table: Overall (Regular + CWL) next to Regular, CWL and, when they have any, Friendly. It covers wars, attacks, stars, average stars and destruction, 3-star rate, best and worst destruction, battle time, hit-ups, how far above or below their own Town Hall they usually attack, missed attacks and attack usage. The tabs under it (Overall, Regular, CWL, Friendly) filter the charts, breakdowns and attack history. The Players table adds Regular ★ and CWL ★ columns on its Overall tab so you can compare everyone at a glance.

### Clan War League

A CWL season is a week: your clan is grouped with seven others and fights **one war per day against a different clan**, in 15v15 or 30v30, with **one attack per player per day**. Create a season on the CWL page, then:

- **Season roster:** everyone registered for the season (all clan members are eligible, up to 50). Edit it any time; players who have fought a day can't be removed.
- **Start each day:** enter that day's opponent and pick the lineup (15 or 30) from the season roster. The lineup starts as the previous day's, so you only swap who's changing. Each clan can be faced once per season.
- **Log attacks** on each day's war like any other war. The type, size and attacks per player are fixed by the season.
- **Standings:** clans are ranked by *league stars*, which are war stars plus 10 bonus stars for each day won, with total destruction (the sum of each day's destruction %) breaking ties. The season page also shows each player's days played, days benched, stars, averages and missed attacks.

- **Bonus medals:** each season page ranks everyone who attacked by how much they contributed, to help decide who deserves the leader's bonus medals. It updates as days finish and is marked *Provisional* until all seven are done. Points come from stars, attacks used, missed attacks, **hit-ups** (attacks on a higher Town Hall), how many levels above, stars earned on hit-ups, triples, and a small discount for stars against lower Town Halls. Hover a score to see exactly where it came from, and use *How points work* for the weights. Set how many medals you have to give (it starts at the number of wars won, since each win unlocks one) and the top of the list is highlighted. The weights are in `lib/awards.ts` if your clan values things differently.

The 10-star win bonus comes from community documentation. If the game changes it, edit `CWL_WIN_BONUS_STARS` in `lib/constants.ts`.

### Enemy Town Hall stats

CWL matchmaking ignores Town Halls, so you'll face a spread of levels. Because the enemy Town Hall is recorded on every attack, players and CWL seasons get a **by enemy Town Hall** breakdown and a **hitting up / same / hitting down** breakdown, plus an up-or-down arrow next to each attack.

### How the numbers are calculated

- **Overall** means Regular plus CWL wars added together. Friendly wars are practice, so they're kept out of Overall and only appear on their own tab. Overall averages are weighted by attacks (all stars divided by all attacks), not an average of the two averages.
- **War stars** count the best result on each enemy base, not the sum of every attack.
- **War destruction** is the average of the best destruction on each enemy base, with unattacked bases counting as 0.
- **Win / loss / tie** is decided when a war has ended and you've entered the opponent's stars and destruction: stars first, then destruction.
- **Missed attacks** and attack usage only count wars that have ended, so a war in progress never counts against anyone.
- **Win rate** is wins out of wars with a recorded result.
- The dashboard trend only plots finished wars.

## Project layout

```
app/(app)/          pages: dashboard, wars, players
components/         app components (components/ui is shadcn)
lib/stats.ts        all statistics, pure functions
lib/cwl.ts          CWL standings and per-season player stats
lib/awards.ts       CWL bonus medal scoring and its weights
lib/compare.ts      one player's Overall / Regular / CWL / Friendly stats side by side
lib/validation.ts   zod schemas shared by forms and server actions
lib/actions/        server actions (every one re-validates its input)
lib/data.ts         read queries returning serialisable DTOs
lib/db.ts           MongoDB connection and document types
```

## Good to know

- There is **no login**. Anyone who can reach the app can read and change the data. Keep it private or put it behind your host's access control before deploying publicly.
- The highest selectable Town Hall is `MAX_TOWN_HALL` in `lib/constants.ts`. Bump it when a new Town Hall is released.
