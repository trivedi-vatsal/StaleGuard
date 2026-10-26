# Edge cases

Where it could break — and why it doesn't. Every failure mode is accounted for, not papered over.

## User never switches tabs

Reload does not trigger. Acceptable — they are on the latest load.

## User is offline on focus

`fetch` throws, caught silently. No crash, no noise.

## CDN strips ETag

Fallback to `Last-Modified` header already handled in the hook.

## Multiple tabs open

Each tab reloads independently on its own focus event.

## Both ETag and Last-Modified missing

No reload is triggered — there is nothing reliable to compare against.

## Auth via sessionStorage

Survives `window.location.reload()` because `sessionStorage` is preserved across reload on the same tab.
