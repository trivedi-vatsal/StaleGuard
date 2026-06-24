import { PageHeader } from "../components/PageHeader";
import { PageNav } from "../components/PageNav";
import { DocsNav } from "../components/DocsNav";
import { FileExplorer } from "../components/FileExplorer";
import { findPage } from "../routes";

const page = findPage("/implementation")!;

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

const files = [
  { path: "public/staticwebapp.config.json", code: codeConfig },
  { path: "src/hooks/useVersionCheck.ts", code: codeHook },
  { path: "src/App.tsx", code: codeUsage },
];

export function Implementation() {
  return (
    <div className="container page">
      <DocsNav current={page.path} />
      <PageHeader
        eyebrow={page.eyebrow}
        heading={page.heading}
        lede={page.lede}
      />

      <p className="step-note">
        Prefer to let an AI agent do it? Grab the{" "}
        <a href="#/">ready-made prompt</a> on the homepage.
      </p>

      <div className="step-card">
        <div className="step-head">
          <span className="step-badge">01</span>
          <span className="step-title">staticwebapp.config.json</span>
        </div>
        <p className="step-desc">
          Tell Azure Static Web Apps never to cache index.html at the CDN or
          browser level. This ensures every request for the entry file
          reaches the origin, allowing the ETag to change when a new build
          is deployed without needing any build plugin or CI configuration.
        </p>
      </div>

      <div className="step-card">
        <div className="step-head">
          <span className="step-badge">02</span>
          <span className="step-title">useVersionCheck.ts</span>
        </div>
        <p className="step-desc">
          Drop this hook at your React root. On mount and on every tab-focus
          event it fires a single HEAD /index.html request with cache:
          no-store. It captures the ETag (or Last-Modified as a fallback) as
          a baseline. If a subsequent check returns a different tag, the
          page silently reloads with no banner, no prompt, and no polling
          timer.
        </p>
      </div>

      <div className="step-card">
        <div className="step-head">
          <span className="step-badge">03</span>
          <span className="step-title">App.tsx</span>
        </div>
        <p className="step-desc">
          Call useVersionCheck once at your application root. No props, no
          context, no configuration needed. The hook self-manages its event
          listeners and cleans up on unmount automatically.
        </p>
      </div>

      <FileExplorer files={files} />

      <PageNav current={page.path} />
    </div>
  );
}
