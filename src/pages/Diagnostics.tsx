import { PageHeader } from "../components/PageHeader";
import { PageNav } from "../components/PageNav";
import { DocsNav } from "../components/DocsNav";
import { findPage } from "../routes";
import type { useVersionCheck } from "../hooks/useVersionCheck";

const page = findPage("/diagnostics")!;

export function Diagnostics({
  versionCheck,
}: {
  versionCheck: ReturnType<typeof useVersionCheck>;
}) {
  const sessionStatus =
    versionCheck.status === "update-detected"
      ? "new deploy!"
      : versionCheck.status === "offline"
        ? "offline"
        : versionCheck.status === "missing-header"
          ? "missing tag"
          : versionCheck.status === "idle"
            ? "waiting"
            : "fresh";

  const deployStatus =
    versionCheck.status === "update-detected"
      ? "New deployment detected"
      : versionCheck.status === "offline"
        ? "Offline or blocked"
        : versionCheck.status === "missing-header"
          ? "Missing cache tag header"
          : "No deploy change";

  const diagPillClass =
    versionCheck.status === "update-detected"
      ? "pill pill-warn"
      : versionCheck.status === "offline" ||
          versionCheck.status === "missing-header"
        ? "pill pill-neutral"
        : "pill pill-accent";

  return (
    <div className="container page">
      <DocsNav current={page.path} />
      <PageHeader
        eyebrow={page.eyebrow}
        heading={page.heading}
        lede={page.lede}
      />

      <div className="stat-row">
        <div>
          <div className="stat-cell-label">Checks run this session</div>
          <div className="stat-cell-value">{versionCheck.checksRun}</div>
        </div>
        <div>
          <div className="stat-cell-label">Last trigger</div>
          <div className="stat-cell-value">
            {versionCheck.lastTrigger ?? "—"}
          </div>
        </div>
        <div>
          <div className="stat-cell-label">Status</div>
          <div className="stat-cell-value">{sessionStatus}</div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          aria-label="Run deployment freshness check now"
          onClick={() => void versionCheck.runCheck("manual")}
        >
          Run check now
        </button>
      </div>

      <div className="diag-card" aria-live="polite">
        <div className="diag-head">
          <div className="diag-title">Hook state</div>
          <div className={diagPillClass}>{deployStatus}</div>
        </div>
        <div className="diag-rows">
          <div className="diag-row">
            <div className="diag-key">Watched file</div>
            <div className="diag-val">{versionCheck.entryPath}</div>
          </div>
          <div className="diag-row">
            <div className="diag-key">Baseline tag</div>
            <div className="diag-val mono-em">
              {versionCheck.baselineTag ?? "—"}
            </div>
          </div>
          <div className="diag-row">
            <div className="diag-key">Latest tag</div>
            <div className="diag-val mono-em">
              {versionCheck.lastSeenTag ?? "—"}
            </div>
          </div>
          <div className="diag-row">
            <div className="diag-key">Last trigger</div>
            <div className="diag-val">{versionCheck.lastTrigger ?? "—"}</div>
          </div>
          <div className="diag-row">
            <div className="diag-key">Last checked</div>
            <div className="diag-val">
              {versionCheck.lastCheckedAt ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <PageNav current={page.path} />
    </div>
  );
}
