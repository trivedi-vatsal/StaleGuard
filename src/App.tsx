import { useState, useCallback } from "react";
import "./App.css";
import { useVersionCheck } from "./hooks/useVersionCheck";
import { useTheme } from "./hooks/useTheme";

const projectName = "StaleGuard";
const projectVersion = "0.1.0";
const publishedUrl = "https://trivedi-vatsal.github.io/StaleGuard/";

const flowSteps = [
  {
    title: "New build deployed",
    body: "Vite embeds new hashed asset filenames into index.html",
    active: false,
  },
  {
    title: "ETag changes on Azure SWA",
    body: "File content change triggers a new ETag automatically - no build plugins required",
    active: false,
  },
  {
    title: "User switches back to tab",
    body: "window focus event fires, hook wakes up",
    active: false,
  },
  {
    title: "HEAD /index.html (no-store)",
    body: "Single lightweight request, no body transferred",
    active: true,
  },
  {
    title: "ETag differs ->",
    body: "window.location.reload() - silent, no prompt",
    active: true,
  },
  {
    title: "ETag same -> do nothing",
    body: "Zero side effects. User continues uninterrupted.",
    active: false,
  },
];

const properties = [
  ["Extra infrastructure", "none", true],
  ["Build plugin required", "no", true],
  ["Polling / timers", "no", true],
  ["Network cost", "1 HEAD request per tab focus", false],
  ["User interaction", "none required", true],
  ["Auth impact", "None - MSAL uses sessionStorage, survives reload", false],
  ["Failure behaviour", "Silent - offline / errors swallowed", false],
] as const;

const edgeCases = [
  [
    "User never switches tabs",
    "Reload does not trigger. Acceptable - they are on the latest load.",
  ],
  [
    "User is offline on focus",
    "fetch throws, caught silently. No crash, no noise.",
  ],
  [
    "CDN strips ETag",
    "Fallback to Last-Modified header already handled in the hook.",
  ],
  [
    "Multiple tabs open",
    "Each tab reloads independently on its own focus event.",
  ],
];

const codeConfig = `{
  "platform": {
    "apiRuntime": "node:18"
  },
  "navigationFallback": {
    "rewrite": "index.html"
  },
  "routes": [
    {
      "route": "/index.html",
      "headers": {
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    }
  ]
}`;

const codeHook = `import { useEffect, useRef } from "react";

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
};`;

const codeUsage = `import { useVersionCheck } from "./hooks/useVersionCheck";

const App = () => {
  useVersionCheck(); // call once at root
  // ...
};`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }, [text]);

  return (
    <button
      className={`copy-btn${copied ? " copied" : ""}`}
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}


function App() {
  const versionCheck = useVersionCheck();
  const { theme, toggle } = useTheme();

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

  return (
    <>
      <nav className="site-nav" aria-label="Primary">
        <a className="nav-logo" href="#hero" aria-label="StaleGuard home">
          {projectName}
        </a>
        <ul className="nav-links">
          <li>
            <a href="#flow">How it works</a>
          </li>
          <li>
            <a href="#hook">Hook</a>
          </li>
          <li>
            <a href="#diag">Diagnostics</a>
          </li>
        </ul>
        <button
          className="theme-toggle"
          type="button"
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </nav>

      <div className="container">
        <section className="hero" id="hero">
          <div className="hero-eyebrow">Vite · React · Azure SWA</div>
          <h1>
            No stale
            <br />
            <span className="line2">builds.</span>
          </h1>
          <p className="hero-desc">
            One hook. One cache header.
            <br />
            <em>Silent reload on tab focus.</em> No banners, no polling,
            <br />
            no user friction. Works with MSAL sessionStorage.
          </p>
          <div className="cta-row">
            <a href="#hook" className="btn-primary">
              Use this pattern
            </a>
            <a href="#diag" className="btn-ghost">
              Live diagnostics
            </a>
          </div>
        </section>

        <div className="divider" />

        <section id="flow">
          <div className="section-label">End-to-end flow</div>
          <div className="flow">
            {flowSteps.map((step, index) => (
              <div
                className={`flow-step${step.active ? " active" : ""}`}
                key={step.title}
              >
                <div className="flow-line">
                  <div className="flow-dot" />
                  {index < flowSteps.length - 1 ? (
                    <div className="flow-connector" />
                  ) : null}
                </div>
                <div className="flow-content">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="section-label">Properties</div>
        <table className="props-table" aria-label="StaleGuard properties">
          <tbody>
            {properties.map(([label, value, isTag]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>
                  {isTag ? <span className="tag-green">{value}</span> : value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="divider" />

        <section id="hook">
          <div className="section-label">Implementation</div>
          <p className="section-intro">
            Three files. No build plugins, no CI changes, no extra infrastructure.
            Copy each snippet in order and you're done.
          </p>

          <div className="step-block">
            <div className="step-head">
              <span className="step-badge">01</span>
              <span className="step-title">staticwebapp.config.json</span>
            </div>
            <p className="step-desc">
              Tell Azure Static Web Apps never to cache index.html at the CDN or browser level.
              This ensures every request for the entry file reaches the origin, allowing the ETag to change
              when a new build is deployed without needing any build plugin or CI configuration.
            </p>
            <div className="code-header">
              <span>public/staticwebapp.config.json</span>
              <CopyButton text={codeConfig} />
            </div>
            <pre><code>{codeConfig}</code></pre>
          </div>

          <div className="step-block">
            <div className="step-head">
              <span className="step-badge">02</span>
              <span className="step-title">useVersionCheck.ts</span>
            </div>
            <p className="step-desc">
              Drop this hook at your React root. On mount and on every tab-focus event it fires a
              single HEAD /index.html request with cache: no-store. It captures the ETag (or
              Last-Modified as a fallback) as a baseline. If a subsequent check returns a different
              tag, the page silently reloads with no banner, no prompt, and no polling timer.
            </p>
            <div className="code-header">
              <span>src/hooks/useVersionCheck.ts</span>
              <CopyButton text={codeHook} />
            </div>
            <pre><code>{codeHook}</code></pre>
          </div>

          <div className="step-block">
            <div className="step-head">
              <span className="step-badge">03</span>
              <span className="step-title">App.tsx</span>
            </div>
            <p className="step-desc">
              Call useVersionCheck once at your application root. No props, no context,
              no configuration needed. The hook self-manages its event listeners and cleans up on
              unmount automatically.
            </p>
            <div className="code-header">
              <span>src/App.tsx</span>
              <CopyButton text={codeUsage} />
            </div>
            <pre><code>{codeUsage}</code></pre>
          </div>
        </section>

        <div className="divider" />

        <section id="diag">
          <div className="section-label">Live diagnostics</div>

          <div className="demo-bar">
            <div>
              <div className="demo-label">Checks run this session</div>
              <div className="demo-value">{versionCheck.checksRun}</div>
            </div>
            <div>
              <div className="demo-label">Last trigger</div>
              <div className="demo-value">{versionCheck.lastTrigger ?? "—"}</div>
            </div>
            <div>
              <div className="demo-label">Status</div>
              <div className="demo-value">{sessionStatus}</div>
            </div>
            <button
              id="run-check"
              type="button"
              aria-label="Run deployment freshness check now"
              onClick={() => void versionCheck.runCheck("manual")}
            >
              Run check now
            </button>
          </div>

          <div className="diag-panel" aria-live="polite">
            <div className="diag-header">
              <div className="diag-title">Hook state</div>
              <div className={`diag-status${versionCheck.status === "update-detected" ? " warn" : versionCheck.status === "offline" || versionCheck.status === "missing-header" ? " neutral" : ""}`}>
                {deployStatus}
              </div>
            </div>
            <div className="diag-rows">
              <div className="diag-row">
                <div className="diag-key">Watched file</div>
                <div className="diag-val">{versionCheck.entryPath}</div>
              </div>
              <div className="diag-row">
                <div className="diag-key">Baseline tag</div>
                <div className="diag-val mono-em">{versionCheck.baselineTag ?? "—"}</div>
              </div>
              <div className="diag-row">
                <div className="diag-key">Latest tag</div>
                <div className="diag-val mono-em">{versionCheck.lastSeenTag ?? "—"}</div>
              </div>
              <div className="diag-row">
                <div className="diag-key">Last trigger</div>
                <div className="diag-val">{versionCheck.lastTrigger ?? "—"}</div>
              </div>
              <div className="diag-row">
                <div className="diag-key">Last checked</div>
                <div className="diag-val">{versionCheck.lastCheckedAt ?? "—"}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-label">Edge cases</div>
        <div className="edge-grid" role="list" aria-label="Edge cases">
          {edgeCases.map(([scenario, outcome]) => (
            <div className="edge-cell" role="listitem" key={scenario}>
              <div className="edge-scenario">{scenario}</div>
              <div className="edge-outcome">{outcome}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="site-footer">
        <span>(c) 2026 {projectName} · MIT</span>
        <div className="footer-right">
          <a href="https://vatsal.xyz/" target="_blank" rel="noreferrer">Vatsal Trivedi</a>
          <span>v{projectVersion}</span>
          <a href={publishedUrl} target="_blank" rel="noreferrer">Live site</a>
        </div>
      </footer>
    </>
  );
}

export default App;
