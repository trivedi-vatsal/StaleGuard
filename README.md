# StaleGuard

This repo is a small Vite + React + TypeScript project that demonstrates silent deployment refreshes for stale tabs.

It is designed to work in two roles:

- a testing ground for validating the focus-triggered version check pattern
- a polished static site that can be published as an article on GitHub Pages

## Core idea

Vite already fingerprints JavaScript and CSS bundles, so the stale deployment problem is really about `index.html`.

Every new build rewrites the hashed bundle references inside `index.html`, which changes the file content. On Azure Static Web Apps, that naturally produces a new `ETag`. The app stores the original tag on first load and checks it again whenever the tab regains focus.

If the tag changed, the app reloads immediately and silently.

## Why the name

StaleGuard describes the goal directly: it guards users from silently continuing on a stale deployed build.

## Repo contents

- `src/hooks/useVersionCheck.ts`: production-oriented hook with `ETag` then `Last-Modified` fallback
- `public/staticwebapp.config.json`: Azure Static Web Apps cache rule for `index.html`
- `src/App.tsx`: article-style page plus a live diagnostics panel
- `.github/workflows/deploy-pages.yml`: GitHub Pages deployment workflow

## Local development

```bash
npm install
npm run dev
```

For a more realistic static-host check:

```bash
npm run build
npm run preview
```

## Azure Static Web Apps behavior

The hook sends:

```ts
fetch(indexHtmlUrl, {
  method: "HEAD",
  cache: "no-store",
});
```

The Azure config sets:

```json
{
  "route": "/index.html",
  "headers": {
    "Cache-Control": "no-cache, no-store, must-revalidate"
  }
}
```

That combination makes sure the browser asks for fresh headers on each focus check.

## GitHub Pages publishing

This repo includes a GitHub Actions workflow that builds the app and deploys `dist/` to GitHub Pages on every push to `master`.

To enable it:

1. Push this repo to GitHub.
2. Open repository settings.
3. Under Pages, set the source to GitHub Actions.
4. Push to `master` or run the workflow manually.

The Vite config uses `base: "./"` so the built site can be served from a project subpath without rewriting asset URLs.

## Testing checklist

1. Deploy one build and open the app.
2. Deploy a changed build.
3. Switch to another tab.
4. Focus the app again.
5. Confirm it reloads and picks up the new bundles.

Also verify:

- offline focus does not crash the app
- multiple tabs refresh independently
- missing `ETag` still works when `Last-Modified` is present

## Notes

- The live diagnostics panel is intentionally visible in this POC so behavior is easy to verify.
- In a production app, you can keep the hook exactly as-is and remove the visible diagnostics UI.
