Two apps that deploy separately; see README.md for the full picture.

- `backend/`: Express + TypeScript API that calls the official Clash of Clans API for one clan. ES modules, so relative imports end in `.js`.
- `frontend/`: the Next.js app. It only talks to the backend, through `lib/data.ts`.

`backend/src/types.ts` and `frontend/lib/types.ts` describe the same JSON; change them together.

@frontend/AGENTS.md
