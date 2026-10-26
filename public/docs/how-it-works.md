# How it works

Six steps, one reload — from a fresh deploy to a silent refresh with no banner, no prompt, and no timer.

## Flow

1. **New build deployed** — Vite embeds new hashed asset filenames into `index.html`.
2. **ETag changes on Azure SWA** — File content change triggers a new `ETag` automatically; no build plugins required.
3. **User switches back to tab** — `window` `focus` event fires; the hook wakes up.
4. **HEAD /index.html (no-store)** — Single lightweight request; no body transferred.
5. **ETag differs** — `window.location.reload()` — silent, no prompt.
6. **ETag same** — Do nothing. Zero side effects; the user continues uninterrupted.

## Properties at a glance

| Property | Value |
| --- | --- |
| Extra infrastructure | none |
| Build plugin required | no |
| Polling / timers | no |
| Network cost | 1 HEAD request per tab focus |
| User interaction | none required |
| Auth impact | None — sessionStorage-backed auth survives reload |
| Failure behaviour | Silent — offline / errors swallowed |
