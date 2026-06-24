import { PageHeader } from "../components/PageHeader";
import { PageNav } from "../components/PageNav";
import { DocsNav } from "../components/DocsNav";
import { findPage } from "../routes";

const page = findPage("/edge-cases")!;

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

export function EdgeCases() {
  return (
    <div className="container page">
      <DocsNav current={page.path} />
      <PageHeader
        eyebrow={page.eyebrow}
        heading={page.heading}
        lede={page.lede}
      />

      <div className="edge-grid" role="list" aria-label="Edge cases">
        {edgeCases.map(([scenario, outcome]) => (
          <div className="edge-card" role="listitem" key={scenario}>
            <div className="edge-scenario">{scenario}</div>
            <div className="edge-outcome">{outcome}</div>
          </div>
        ))}
      </div>

      <PageNav current={page.path} />
    </div>
  );
}
