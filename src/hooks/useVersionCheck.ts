import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type VersionCheckTrigger = "mount" | "focus" | "manual";
type VersionCheckStatus =
  | "idle"
  | "ready"
  | "unchanged"
  | "update-detected"
  | "missing-header"
  | "offline";

type VersionCheckState = {
  baselineTag: string | null;
  checksRun: number;
  lastCheckedAt: string | null;
  lastSeenTag: string | null;
  lastTrigger: VersionCheckTrigger | null;
  status: VersionCheckStatus;
};

const formatTimestamp = () =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date());

export const useVersionCheck = () => {
  const currentTag = useRef<string | null>(null);
  const inFlight = useRef(false);
  const entryUrl = useMemo(
    () => new URL("index.html", document.baseURI).toString(),
    [],
  );
  const entryPath = useMemo(() => new URL(entryUrl).pathname, [entryUrl]);
  const [state, setState] = useState<VersionCheckState>({
    baselineTag: null,
    checksRun: 0,
    lastCheckedAt: null,
    lastSeenTag: null,
    lastTrigger: null,
    status: "idle",
  });

  const checkVersion = useCallback(async (trigger: VersionCheckTrigger) => {
    // Tab-focus and visibility events can fire back-to-back for the same
    // switch; skip a check that's already in flight instead of racing two
    // fetches and risking a duplicate reload.
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const response = await fetch(entryUrl, {
        method: "HEAD",
        cache: "no-store",
      });
      const nextTag =
        response.headers.get("ETag") ?? response.headers.get("Last-Modified");
      const timestamp = formatTimestamp();

      if (!currentTag.current) {
        currentTag.current = nextTag;
        setState((previous) => ({
          ...previous,
          baselineTag: nextTag,
          checksRun: previous.checksRun + 1,
          lastCheckedAt: timestamp,
          lastSeenTag: nextTag,
          lastTrigger: trigger,
          status: nextTag ? "ready" : "missing-header",
        }));
        return;
      }

      if (nextTag && currentTag.current !== nextTag) {
        setState((previous) => ({
          ...previous,
          checksRun: previous.checksRun + 1,
          lastCheckedAt: timestamp,
          lastSeenTag: nextTag,
          lastTrigger: trigger,
          status: "update-detected",
        }));
        window.location.reload();
        return;
      }

      setState((previous) => ({
        ...previous,
        checksRun: previous.checksRun + 1,
        lastCheckedAt: timestamp,
        lastSeenTag: nextTag,
        lastTrigger: trigger,
        status: nextTag ? "unchanged" : "missing-header",
      }));
    } catch {
      setState((previous) => ({
        ...previous,
        checksRun: previous.checksRun + 1,
        lastCheckedAt: formatTimestamp(),
        lastTrigger: trigger,
        status: "offline",
      }));
    } finally {
      inFlight.current = false;
    }
  }, [entryUrl]);

  useEffect(() => {
    void checkVersion("mount");

    const onFocus = () => {
      void checkVersion("focus");
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkVersion("focus");
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [checkVersion]);

  const statusLabel = {
    idle: "Waiting",
    ready: "Baseline captured",
    unchanged: "No deploy change",
    "update-detected": "Update found",
    "missing-header": "No cache tag header",
    offline: "Offline or blocked",
  }[state.status];

  return {
    ...state,
    entryPath,
    runCheck: checkVersion,
    statusLabel,
  };
};
