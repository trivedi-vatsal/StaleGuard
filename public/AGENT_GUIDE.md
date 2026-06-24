# Implementing the StaleGuard pattern in a React app

This is a self-contained guide for an AI coding agent (or a developer) to add
**silent stale-deployment recovery** to an existing Vite + React + TypeScript
project. No build plugins, no polling timers, no user-facing prompts.

## What this does

Vite fingerprints JS/CSS bundle filenames on every build, but `index.html`
itself changes content on each deploy (it references the new hashed bundles).
That content change naturally produces a new `ETag` (or `Last-Modified`) header
on most static hosts.

The pattern: store the tag for `index.html` on first load, and re-check it
every time the tab regains focus. If the tag changed, the deploy moved on
without the user — reload immediately and silently with `window.location.reload()`.

## Prerequisites

- A Vite + React + TypeScript project
- A static host that serves `index.html` with `ETag` and/or `Last-Modified`
  headers (Azure Static Web Apps, GitHub Pages, Netlify, Vercel, etc.)

## Step 1 — disable caching for `index.html` (host-specific)

The freshness check only works if the browser is forced to revalidate
`index.html` on every request instead of serving it from cache.

### Azure Static Web Apps

Add (or merge into) `public/staticwebapp.config.json`:

```json
{
  "routes": [
    {
      "route": "/index.html",
      "headers": {
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    }
  ]
}
```

### Other static hosts (GitHub Pages, Netlify, Vercel, S3/CloudFront, nginx, ...)

Set `Cache-Control: no-cache, no-store, must-revalidate` on `index.html`
specifically (leave hashed assets in `assets/` cached aggressively — they are
immutable). If you cannot control headers (e.g. plain GitHub Pages), the hook
below still works using `Last-Modified`, but checks will be less precise
because some CDNs round timestamps to whole seconds.

## Step 2 — add the hook

Create `src/hooks/useVersionCheck.ts`:

```ts
import { useEffect, useRef } from "react";

export const useVersionCheck = () => {
  const currentTag = useRef<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch(new URL("index.html", document.baseURI), {
          method: "HEAD",
          cache: "no-store",
        });

        const nextTag =
          res.headers.get("ETag") ?? res.headers.get("Last-Modified");

        if (!currentTag.current) {
          currentTag.current = nextTag; // baseline - no reload
          return;
        }

        if (nextTag && currentTag.current !== nextTag) {
          window.location.reload(); // new deploy detected
        }
      } catch {
        // offline / network failures are ignored
      }
    };

    void checkVersion();
    window.addEventListener("focus", checkVersion);
    return () => window.removeEventListener("focus", checkVersion);
  }, []);
};
```

## Step 3 — call it once at the app root

In `src/App.tsx` (or wherever your top-level component lives):

```ts
import { useVersionCheck } from "./hooks/useVersionCheck";

const App = () => {
  useVersionCheck(); // call once at root, no props, no config
  // ...rest of the app
};
```

That's it — three files, no extra infrastructure, no CI changes.

## How it behaves

| Scenario | Outcome |
|---|---|
| User never switches tabs | No reload — they're already on the latest load they fetched |
| User is offline on focus | `fetch` throws, caught silently — no crash, no banner |
| CDN strips `ETag` | Falls back to `Last-Modified` automatically |
| Both headers missing | No reload triggered (nothing to compare against) |
| Multiple tabs open | Each tab checks and reloads independently on its own focus event |
| Auth via MSAL / sessionStorage | Survives the reload — sessionStorage is preserved across `location.reload()` |

## Verifying it works

1. `npm run build && npm run preview`
2. Open the preview URL, confirm a baseline tag is captured (add temporary
   logging if needed — the production hook above is silent by design)
3. Make a visible change, run `npm run build` again
4. Switch to another tab, then focus the original tab again
5. Confirm the page reloads silently and shows the new build

## Notes for the agent

- Do not add a visible banner, toast, or confirmation prompt — the entire
  point of this pattern is a frictionless, invisible refresh.
- Do not add polling/`setInterval` — focus-triggered checks are sufficient and
  cheaper (one `HEAD` request per tab focus, no body transferred).
- Keep the hook dependency-free (no extra libraries) so it can be dropped into
  any React project unchanged.
