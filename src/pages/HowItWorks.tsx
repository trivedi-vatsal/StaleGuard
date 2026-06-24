import { PageHeader } from "../components/PageHeader";
import { PageNav } from "../components/PageNav";
import { DocsNav } from "../components/DocsNav";
import { findPage } from "../routes";

const page = findPage("/how-it-works")!;

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

export function HowItWorks() {
  return (
    <div className="container page">
      <DocsNav current={page.path} />
      <PageHeader
        eyebrow={page.eyebrow}
        heading={page.heading}
        lede={page.lede}
      />

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

      <div className="subsection-label">Properties at a glance</div>
      <div className="props-card" aria-label="StaleGuard properties">
        {properties.map(([label, value, isTag]) => (
          <div className="props-row" key={label}>
            <span className="props-label">{label}</span>
            <span className="props-value">
              {isTag ? <span className="pill pill-accent">{value}</span> : value}
            </span>
          </div>
        ))}
      </div>

      <PageNav current={page.path} />
    </div>
  );
}
