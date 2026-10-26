# Implementation

Three files. Copy, paste, done. No build plugins, no CI changes, no extra infrastructure.

For the complete guide with every code block (recommended for AI agents), use [AGENT_GUIDE.md](../AGENT_GUIDE.md).

## Step 01 — `staticwebapp.config.json`

Tell Azure Static Web Apps never to cache `index.html` at the CDN or browser level. This ensures every request for the entry file reaches the origin, allowing the `ETag` to change when a new build is deployed without needing any build plugin or CI configuration.

## Step 02 — `useVersionCheck.ts`

Drop this hook at your React root. On mount and on every tab-focus event it fires a single `HEAD` `/index.html` request with `cache: no-store`. It captures the `ETag` (or `Last-Modified` as a fallback) as a baseline. If a subsequent check returns a different tag, the page silently reloads with no banner, no prompt, and no polling timer.

## Step 03 — `App.tsx`

Call `useVersionCheck` once at your application root. No props, no context, no configuration needed. The hook self-manages its event listeners and cleans up on unmount automatically.

## Files to copy

| Path | Purpose |
| --- | --- |
| `public/staticwebapp.config.json` | `Cache-Control` for `/index.html` on Azure SWA |
| `src/hooks/useVersionCheck.ts` | Focus-triggered version check |
| `src/App.tsx` | Call the hook once at the root |

Full source for each file is in [AGENT_GUIDE.md](../AGENT_GUIDE.md).

## AI agent shortcut

On the live site homepage, copy the agent prompt that points at `AGENT_GUIDE.md` on the same origin as the deployed site.
