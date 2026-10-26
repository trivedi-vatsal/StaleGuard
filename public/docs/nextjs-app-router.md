# StaleGuard for Next.js (App Router, self-hosted)

This is the Next.js version of the StaleGuard pattern. It was built and tested on
a production Next.js 16 App Router app that runs as a `output: "standalone"` Docker
container deployed by Coolify. The original guide targets Vite on a static host;
this one covers what had to change, why, and what was verified.

It can be followed by a developer or handed to an AI coding agent as-is.

---

## The problem, restated for Next.js

A user opens the app, leaves the tab open, and you deploy. The new container
serves a new build. The open tab is still running the old one:

- Its next lazy `import()` asks for an old `/_next/static/chunks/…js` file. The new
  container doesn't have it, so the request 404s and the user sees a
  `ChunkLoadError` or a blank section.
- Its next client-side navigation fetches a React Server Components payload from
  the new server, which may not match the old client code.
- A Server Action called from the old page may use an action ID the new server
  doesn't recognise.

On a static host the old files often linger on a CDN. With a self-hosted container
they are gone the moment the old container stops.

## Why the Vite recipe doesn't port directly

The original StaleGuard compares the `ETag` (or `Last-Modified`) of `index.html`.
None of that exists here:

| Vite + static host | Next.js standalone container |
|---|---|
| A static `index.html` whose content changes per deploy | No `index.html`; pages are rendered per request |
| The host derives a stable `ETag` from that file | Dynamic pages have no stable `ETag`; it can differ per request or be missing |
| Disable caching for `index.html` (Step 1) | Not needed: the check goes to an API route with `no-store` |

So instead of an HTTP header, the check compares a **build identifier** that the
server reports from an API route.

There are two obvious ways to get that identifier wrong:

1. **Generating a random ID in `next.config.ts`** (for example
   `generateBuildId: () => crypto.randomUUID()`, plus the same value exposed as a
   `NEXT_PUBLIC_*` variable). `next.config` can run more than once during
   `next build` (main process and workers). Each run can produce a different
   value, so the client and the server end up with different IDs and every focus
   reloads the page. Use a value that comes from outside the build (a commit SHA),
   or read the ID Next itself wrote.
2. **Baking the expected ID into the client.** The client doesn't need to know
   its own build ID. Like the original pattern, it records whatever the server
   says on first load and compares later answers against that.

## The design: two layers plus one cleanup

| Layer | Covers | Cost |
|---|---|---|
| **1. Focus check** (the StaleGuard hook) | A tab left in the background during a deploy. When the user comes back, the page reloads before they act. | One tiny request per window focus |
| **2. Next's built-in version-skew protection** (`deploymentId`) | A user who stays in the tab through a deploy and then clicks a link. Next notices the mismatch and does a full page load instead of a client navigation. | Nothing at runtime; one build argument |
| **Cleanup: pause existing polls in hidden tabs** | Not part of stale-build recovery; reduces server load from the app's own polling | Negative |

No new polling, no WebSockets, no banners.

---

## Step 1: a version endpoint

Create `src/app/api/version/route.ts`:

```ts
import { readFileSync } from "node:fs"
import path from "node:path"
import { NextResponse } from "next/server"

// Read at request time, never prerendered: the answer is whichever build is
// serving right now, which is the point of asking.
export const dynamic = "force-dynamic"

// One container serves one build, so the file is read once per process. The
// standalone output carries .next/BUILD_ID next to server.js; `next dev` may
// not have one, and then there is nothing to compare.
let buildId: string | null | undefined

function readBuildId(): string | null {
  if (buildId === undefined) {
    try {
      buildId = readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim() || null
    } catch {
      buildId = null
    }
  }
  return buildId
}

/** The build this server is running, for useVersionCheck to notice a redeploy. */
export async function GET() {
  // With a deployment ID set, Next pins BUILD_ID to a constant, so the
  // deployment ID (inlined into server code at build) is what changes per deploy.
  return NextResponse.json(
    { buildId: process.env.NEXT_DEPLOYMENT_ID || readBuildId() },
    { headers: { "Cache-Control": "no-store" } }
  )
}
```

Why each part is there:

- **`.next/BUILD_ID`** is written by every `next build` (a random nanoid by
  default). Next lists it among the files the standalone output must carry, so
  it is present in the container at `/app/.next/BUILD_ID` when `server.js` runs
  from `/app`.
- **`process.env.NEXT_DEPLOYMENT_ID` comes first.** Once a deployment ID is set
  (Step 5), Next stops generating a random build ID and writes a hard-coded
  constant instead (`build-TfctsWXpff2fKS` in Next 16). Reading only `BUILD_ID`
  would then return the same value for every deploy, and the focus check would
  silently stop working. Next inlines `process.env.NEXT_DEPLOYMENT_ID` into
  server code at build time; when no deployment ID is configured it becomes
  `false`, so the `||` falls through to `BUILD_ID`.
- **`force-dynamic`** stops Next from prerendering the route at build time.
- **`Cache-Control: no-store`** so no browser or proxy answers from cache.
- **Read once per process:** a container never changes build, so there is no
  reason to touch the disk on every request.

## Step 2: the hook

Create `src/hooks/use-version-check.ts`:

```ts
"use client"

import { useEffect, useRef } from "react"

/**
 * Silent stale-build recovery (the StaleGuard pattern). The first check records
 * the build the server is running; each time the tab regains focus it asks
 * again, and a different answer means a deploy happened while this tab sat on
 * the old one — whose /_next/static chunks are gone from the new container, so
 * the next lazy import would fail. Reload then, without a prompt.
 *
 * Unlike the plain pattern, the reload waits while a dialog is open (forms live
 * in them); the baseline is left alone, so the next focus asks again. Pages
 * with their own beforeunload guard still get to stop the reload.
 */
export function useVersionCheck() {
  const baseline = useRef<string | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" })
        if (!res.ok) return
        const { buildId } = (await res.json()) as { buildId: string | null }
        if (!buildId) return
        if (!baseline.current) {
          baseline.current = buildId
          return
        }
        if (buildId === baseline.current) return
        if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
        window.location.reload()
      } catch {
        // Offline, or the server is mid-restart: try again on the next focus.
      }
    }

    void check()
    window.addEventListener("focus", check)
    return () => window.removeEventListener("focus", check)
  }, [])
}
```

Differences from the original hook, and why:

| Change | Reason |
|---|---|
| Fetches `/api/version` JSON instead of `HEAD index.html` | There is no `index.html` (see above) |
| `if (!res.ok) return` | A 404/500 or a redirect to a login page must not count as a new build |
| **Dialog guard**: skip the reload while `[role="dialog"]` or `[role="alertdialog"]` is in the DOM | This app keeps its forms in dialogs. A silent reload would throw away a half-filled form. The baseline isn't updated, so the next focus asks again and reloads once the dialog is closed. Radix/shadcn dialogs, sheets and popovers remove their content from the DOM when closed, so a closed dialog can't block reloads forever. Check your codebase for `forceMount` on dialogs before relying on this. |
| No special handling for unsaved editor state | Not needed: `window.location.reload()` fires `beforeunload`. Any page that already guards unsaved work with `beforeunload` gets the browser's "Leave site?" prompt instead of losing data. That keeps the hook free of feature-specific imports. |

> **Do not import feature code into this hook.** An early version imported a
> "has unsaved drafts" helper from a feature module. That was reverted for two
> reasons: the hook belongs at the root and shouldn't know about features, and
> the `beforeunload` guard already covers it. Also, never load such a helper
> lazily with `import()`: after a deploy, the old chunk it lives in is exactly
> the file that's missing.

## Step 3: call it once at the root

The App Router root layout is a Server Component, so call the hook from the
client-side providers component it already renders:

```tsx
// src/components/providers.tsx
"use client"

import { useVersionCheck } from "@/hooks/use-version-check"

export function Providers({ children }: ProvidersProps) {
  useVersionCheck()

  return (
    <SessionProvider>
      {/* ...existing providers... */}
      {children}
    </SessionProvider>
  )
}
```

`Providers` wraps every route, including the login pages, so every tab is
covered. Make sure it's mounted exactly once (`grep -rn "<Providers" src`).

## Step 4: let the endpoint through auth middleware

If middleware redirects unauthenticated requests to `/login`, add the route to
the public list:

```ts
// src/middleware.ts
const publicRoutes = [
  "/login",
  // ...
  "/api/health",
  "/api/version",
]
```

Without this, a tab whose session expired gets a redirect to an HTML page,
`res.json()` throws, and the check does nothing. The route only exposes a build
identifier.

Note on cost: if the middleware calls `auth()` before checking the public list
(as this one does), adding the route doesn't skip that call. With JWT sessions
it only decodes a cookie, so the cost is negligible; with database sessions,
consider moving the public check first.

## Step 5: version-skew protection with `deploymentId`

The focus check doesn't help a user who never leaves the tab. Next.js has
built-in protection for that. When a deployment ID is set at build time, Next:

1. Adds `?dpl=<id>` to static asset URLs.
2. Sends the client's ID in an `x-deployment-id` header on navigation requests.
3. Returns the server's ID in an `x-nextjs-deployment-id` response header.
4. Puts `data-dpl-id="<id>"` on the `<html>` element.
5. On a mismatch, the App Router performs a full page load instead of a client
   navigation (`fetch-server-response.js`: header ≠ client ID → `doMpaNavigation`).

So the user keeps working on the old build until they click a link, and that
click lands on the new build with a full load. Nothing is interrupted.

The ID must be **the same for the whole build and different for every deploy**.
A git commit SHA is ideal. Next reads it from the `NEXT_DEPLOYMENT_ID`
environment variable, so no `next.config.ts` change is needed.

### Dockerfile (builder stage)

```dockerfile
ARG CACHEBUST=1
COPY . .

# Version skew protection. Next reads NEXT_DEPLOYMENT_ID at build time: open
# tabs from an older deploy then do a full page load on their next navigation
# instead of requesting chunks this image no longer has. Coolify supplies the
# commit as SOURCE_COMMIT; left empty, the deployment ID is simply off.
ARG SOURCE_COMMIT=
ENV NEXT_DEPLOYMENT_ID=$SOURCE_COMMIT

RUN npm run build
```

- Place it after `COPY . .`. The source copy already changes on every commit, so
  the extra argument costs no layer caching.
- The runtime stage doesn't need the variable. The ID is compiled into the build
  output.
- **Empty is safe.** Next ignores an empty `NEXT_DEPLOYMENT_ID`, so the build
  works without it; skew protection is simply off, and `/api/version` falls back
  to `BUILD_ID`.

### docker-compose (each file that builds the production target)

```yaml
services:
  dashboard:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
      args:
        SOURCE_COMMIT: "${SOURCE_COMMIT:-}"
```

**Coolify:** Coolify exposes the commit as `SOURCE_COMMIT`. It may need the
setting that includes the source commit in the build turned on for the app.
Other platforms have their own variable (`GITHUB_SHA` in GitHub Actions,
`VERCEL_GIT_COMMIT_SHA` on Vercel, and so on); pass whichever you have.

## Step 6 (optional cleanup): pause existing polls in hidden tabs

This app already had a notification bell polling an unread count every 30
seconds. Browsers slow timers in background tabs but don't stop them, so a tab
left open overnight kept polling. The fix:

```tsx
// Poll for unread count every 30 seconds while the tab is visible, and once
// on return — a hidden tab shows nobody the count it would be fetching
useEffect(() => {
  const fetchUnreadCount = async () => { /* unchanged */ }

  const fetchIfVisible = () => {
    if (document.visibilityState === "visible") fetchUnreadCount()
  }

  fetchUnreadCount()
  const interval = setInterval(fetchIfVisible, 30000)
  document.addEventListener("visibilitychange", fetchIfVisible)
  return () => {
    clearInterval(interval)
    document.removeEventListener("visibilitychange", fetchIfVisible)
  }
}, [])
```

---

## Options considered and rejected

| Option | Why not |
|---|---|
| **A separate version poll** (every few minutes) | Doubles requests per open tab for something layer 2 already handles at the next click. The original guide also says not to poll. |
| **Ride on an existing poll** (return `buildId` from the notifications endpoint and show a "New version, Reload" toast) | Works and adds zero requests, but once `deploymentId` is on, a user who stays on one page just keeps working until their next click, which then loads the new build. A toast would nag about something that already resolves safely. Worth adding only if urgent fixes must reach people who sit on one page for hours. |
| **Write a "new version" notification per user per deploy** | One database write per user per deploy, fills everyone's notification list with deploy noise, and still only arrives on the next poll. |
| **Server-sent events or WebSockets** | Every tab holds a connection open permanently. Harder on a single container behind a reverse proxy than a request per focus. |
| **Silent reload everywhere, no guards** (the original pattern) | Fine for a static marketing site; loses work in an app with forms and editors. |

## Behaviour

| Scenario | Outcome |
|---|---|
| Tab in the background during a deploy, user comes back | `focus` → new ID → page reloads before they act |
| Same, but a dialog is open | No reload; checked again on the next focus |
| Same, but a page has unsaved work guarded by `beforeunload` | Browser shows "Leave site?" before reloading |
| User stays in the tab through a deploy, then clicks a link | Next sees the deployment ID mismatch and does a full page load (needs Step 5) |
| User stays in the tab and never clicks | Stays on the old build; nothing breaks until they act |
| Offline or server restarting on focus | Request fails, caught silently, retried on the next focus |
| Session expired | Route is public, so the check still works |
| `next dev` | `BUILD_ID` may be missing → `null` → no reload |
| `SOURCE_COMMIT` not passed | Skew protection off; focus check uses `BUILD_ID` |
| After the reload | New page records the new ID as its baseline; later focuses don't reload (no loop) |
| Several tabs | Each checks and reloads on its own focus |
| Rolling deploy where old and new containers briefly both answer | At worst one extra reload; the next focus settles it |

## Verification that was run

Type-check and lint: `tsc --noEmit` had no errors in `src` (only stale generated
types for deleted routes), and ESLint found no new problems.

Two production builds were made in an isolated copy of the repo (so the running
dev server's `.next` wasn't touched), each started with the standalone
`server.js` exactly as in the container:

- **Build A:** no `NEXT_DEPLOYMENT_ID`.
- **Build B:** `NEXT_DEPLOYMENT_ID=test456`.

| Test | Result |
|---|---|
| `next build` | Succeeded; `/api/version` listed as dynamic (`ƒ`) |
| Build ID with a deployment ID set | Both `.next/BUILD_ID` and the standalone copy held the constant `build-TfctsWXpff2fKS`, confirming the version route must prefer the deployment ID |
| Build A: `GET /api/version`, no cookie | `200`, `{"buildId":"JiHYwEQfWj9EHC4QiNxfy"}` (its random `BUILD_ID`), `Cache-Control: no-store`; no `?dpl=` on scripts |
| Build B: `GET /api/version` | `{"buildId":"test456"}` |
| Build B: page HTML | `data-dpl-id` set on `<html>`; scripts load as `…js?dpl=test456` |
| Build B: navigation request sent with `x-deployment-id: old999` | Response header `x-nextjs-deployment-id: test456`; Next's router code turns that mismatch into a full page load |
| **Browser:** page loaded from build A, server swapped to build B on the same port, real tab switch, fake `role="dialog"` element present | `focus` fired, the check saw `test456`, **no reload** |
| Same tab, fake dialog removed, `focus` sent | **Reloaded:** navigation type `reload`, a marker variable on `window` was cleared, scripts came from build B (`?dpl=test456`) |
| Same tab after the reload, `focus` sent again | No further reload (no loop) |

Notes on the browser test:

- Events and every `/api/version` answer were logged to `sessionStorage`, so the
  log survived the reload.
- Browser automation stopped being able to hide the tab after the first round,
  so the final reload step dispatched the `focus` event from JavaScript. It runs
  the same listener; the first round had already shown that a real tab switch
  fires `focus` and triggers the check.
- On initial load, the hook made one call on mount and two more as the window
  received `focus`. That's expected and harmless; the hook is mounted once.

Not verified in this run:

- The poll pausing in hidden tabs (needed a logged-in session on the local build).
- That the hosting platform passes the commit SHA to the build. See the checklist
  below.

## Post-deploy checklist

1. Open any page and view source: `<html>` should have `data-dpl-id="<commit SHA>"`.
2. `GET /api/version` should return the same SHA.
3. If both are missing, the commit isn't reaching the build. On Coolify, enable
   the option to include the source commit in the build. The focus check keeps
   working meanwhile, using `BUILD_ID`.
4. To see the whole flow: open the app, switch to another tab, deploy, come back.
   The page should reload onto the new build.

## How to test it locally

```bash
# Build A (no deployment ID)
next build
mv .next/standalone /tmp/runA && cp -R public /tmp/runA/ && cp -R .next/static /tmp/runA/.next/

# Build B (with a deployment ID)
rm -rf .next
NEXT_DEPLOYMENT_ID=test456 next build
mv .next/standalone /tmp/runB && cp -R public /tmp/runB/ && cp -R .next/static /tmp/runB/.next/

# Run A, open the app in a browser, then swap to B on the same port
(cd /tmp/runA && PORT=3999 node server.js)
# ...switch tabs, stop A...
(cd /tmp/runB && PORT=3999 node server.js)
# ...switch back: the page should reload onto B
```

If a dev server is running from the same folder, build in a copy so you don't
overwrite its `.next`. If auth complains about an untrusted host locally, set
`AUTH_TRUST_HOST=true` and point `AUTH_URL` / `NEXTAUTH_URL` at the local port.

## Files changed in the reference implementation

| File | Change |
|---|---|
| `src/app/api/version/route.ts` | New: reports the deployment ID, else `BUILD_ID` |
| `src/hooks/use-version-check.ts` | New: the focus check with the dialog guard |
| `src/components/providers.tsx` | Calls `useVersionCheck()` once |
| `src/middleware.ts` | `/api/version` added to public routes |
| `Dockerfile` | `ARG SOURCE_COMMIT` → `ENV NEXT_DEPLOYMENT_ID` in the builder stage |
| `docker-compose.yml`, `.test.yml`, `.uat.yml` | Pass `SOURCE_COMMIT` as a build arg |
| `src/components/notifications/notification-center.tsx` | Unread-count poll skips hidden tabs |

No database changes, no new dependencies.

## How the implementation evolved

1. **Started from the Vite guide.** Found the target is Next.js 16 standalone in
   Docker, so `index.html` and its `ETag` don't exist. Switched to an API route
   that reads `.next/BUILD_ID` at runtime, keeping the original "record a
   baseline, compare on focus" logic.
2. **Added guards for an app with forms.** First version skipped the reload for
   an open dialog *and* for unsaved site-plan drafts, by importing a helper from
   the site plan feature.
3. **Moved everything to the root.** Reverted the feature import. The page's
   existing `beforeunload` guard already turns a reload into a "Leave site?"
   prompt, so only the generic dialog guard stayed.
4. **Asked how the browser finds out.** It doesn't get told; it asks on focus.
   That leaves users who never switch tabs.
5. **Looked at the existing notification poll** as a way to learn about new builds
   without extra requests, and at its server cost (JWT sessions, indexed counts:
   cheap, but it ran in hidden tabs too).
6. **Chose layered protection:** keep the focus check, add Next's `deploymentId`
   for the never-leaves-the-tab case, and pause the existing poll in hidden tabs.
   Dropped the toast idea.
7. **Found a trap while adding `deploymentId`:** Next pins `BUILD_ID` to a
   constant once it's set, which would have broken the focus check. The version
   route now prefers the deployment ID.
8. **Verified** with type-check, lint, two production builds, header checks and
   a browser run across a build swap.

## Notes for the agent

- Keep the hook dependency-free and free of feature imports.
- Don't add `setInterval` polling for versions; focus checks plus `deploymentId`
  cover the cases.
- Don't generate build IDs inside `next.config`; use a commit SHA from the build
  environment, or let the server report the ID Next wrote.
- If you set `deploymentId`, the version endpoint must report it rather than
  `BUILD_ID`.
- Guard the reload against open dialogs in apps with forms; rely on
  `beforeunload` for editors that already have it.
- Never lazy-load anything the reload decision depends on.
