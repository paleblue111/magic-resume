# P0: Access code + no AI

## Access codes

- There is **no** login/register. Users enter a string **access code**.
- A valid code maps 1:1 to a server-side namespace under:

  ```
  ./data/spaces/<code>/
  ```

  Each resume is stored as `<resumeId>.json` (full `ResumeData`).

- Validation (shared secret / folder name):
  - Length 3–64
  - Pattern: `^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$`
  - Rejects `/`, `\`, `..`, NUL, and reserved names
- On success, the server sets an **httpOnly** cookie `space_code` (SameSite=Lax, 30 days).
- Wrong/empty code → no cookie → API returns 401; UI shows the gate screen.

## API

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/space/enter` | Body `{ code }` → set cookie, return resume map |
| POST | `/api/space/leave` | Clear cookie |
| GET | `/api/space/session` | Current cookie → code + resumes |
| GET | `/api/resumes` | List summaries (`?full=1` for full map) |
| POST | `/api/resumes` | Create resume JSON |
| GET | `/api/resumes/:id` | Get one |
| PUT | `/api/resumes/:id` | Upsert full ResumeData |
| DELETE | `/api/resumes/:id` | Delete |

Image proxy `/api/proxy/image` is unchanged (non-AI).

## Frontend behaviour

- Gate screen (zh/en) before dashboard/workbench.
- After enter: Zustand is hydrated from the server (source of truth).
- Edits debounce (~1.2s) `PUT` to the server; localStorage remains an offline cache via existing persist middleware.
- Create defaults to one-click default template; import is **JSON only**.

## Run locally

```sh
pnpm install
pnpm dev          # http://localhost:3000
# or
pnpm build && pnpm start
```

Data directory is created automatically at `./data/spaces/` (gitignored).

For HTTPS production, set `COOKIE_SECURE=1` so the `space_code` cookie includes the Secure flag.

Docker: `docker compose up --build` mounts `./data` to `/app/data`.

## Removed in P0

- AI polish / grammar APIs and UI
- AI dashboard / config stores
- AI PDF resume import
- Packages: `@google/generative-ai`, `streamdown`
