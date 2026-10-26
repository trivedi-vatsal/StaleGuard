import { WindowDots } from "../components/WindowDots";
import { CodeCard } from "../components/CodeCard";
import { RecipePicker } from "../components/RecipePicker";
import { pages } from "../routes";

const heroSnippet = `const tag = await fetch("index.html", {
  method: "HEAD",
  cache: "no-store",
});

if (tag !== baseline) {
  window.location.reload();
}`;

const llmsUrl = new URL("llms.txt", document.baseURI).href;

const agentPrompt = `Fetch ${llmsUrl} for the doc index. Use AGENT_GUIDE.md for Vite + static host, or docs/nextjs-app-router.md for Next.js App Router (self-hosted). Implement the StaleGuard silent-reload-on-stale-deploy pattern for this project.`;

const exploreCards = pages.filter((page) => page.path !== "/");

const scrollToAgentPrompt = () => {
  document
    .getElementById("agent-prompt")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <button
          type="button"
          className="hero-badge glass"
          onClick={scrollToAgentPrompt}
        >
          <span className="badge-dot" aria-hidden="true" />
          AI agent prompt included
          <span aria-hidden="true">↓</span>
        </button>
        <h1>
          No stale
          <br />
          <span className="text-gradient">builds.</span>
        </h1>
        <p className="hero-desc">
          One hook. One cache header.
          <br />
          <em>Silent reload on tab focus.</em> No banners, no polling,
          <br />
          no user friction. sessionStorage-backed auth survives reload.
        </p>
        <div className="cta-row">
          <a href="#/implementation" className="btn btn-primary btn-lg">
            Vite recipe
          </a>
          <a href="#/nextjs" className="btn btn-secondary btn-lg">
            Next.js recipe
          </a>
          <a href="#/diagnostics" className="btn btn-secondary btn-lg">
            Live diagnostics
          </a>
        </div>
        <p className="hero-stack">Vite · Next.js · React</p>

        <div className="hero-panel-wrap">
          <div className="hero-panel glass">
            <div className="hero-pane">
              <div className="pane-head">
                <WindowDots />
                <span className="pane-name">useVersionCheck.ts</span>
              </div>
              <pre className="pane-code">
                <code>{heroSnippet}</code>
              </pre>
            </div>
            <div className="hero-pane hero-pane-terminal">
              <div className="pane-head">
                <span className="pane-name">terminal</span>
              </div>
              <div className="terminal-lines">
                <p>
                  <span className="prompt">$</span> focus tab
                </p>
                <p className="dim">HEAD /index.html (no-store)…</p>
                <p>
                  <span className="ok">✓</span> ETag differs
                </p>
                <p>
                  <span className="ok">✓</span> window.location.reload()
                </p>
                <p className="watching">
                  <span className="pulse-dot" aria-hidden="true" />
                  watching for focus
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section id="agent-prompt" className="agent-feature">
        <div className="agent-feature-glow" aria-hidden="true" />
        <div className="agent-feature-grid">
          <div>
            <span className="eyebrow">AI agent shortcut</span>
            <h2>
              Skip the docs. <span className="text-gradient">Paste this.</span>
            </h2>
            <p className="lede">
              Drop this prompt into Claude Code, Cursor, or any agent that
              can fetch URLs. It points at llms.txt and the right recipe guide
              (Vite or Next.js) — no copying code blocks by hand.
            </p>
            <div className="agent-tool-row">
              <span className="tool-pill">Claude Code</span>
              <span className="tool-pill">Cursor</span>
              <span className="tool-pill">Copilot</span>
              <span className="tool-pill">Windsurf</span>
            </div>
          </div>
          <div className="code-card-featured">
            <CodeCard name="Prompt for your AI coding agent" code={agentPrompt} />
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="recipes-section">
        <div className="subsection-label">Recipes</div>
        <p className="lede recipes-lede">
          Two first-class guides: static Vite on Azure SWA or GitHub Pages, and
          self-hosted Next.js in Docker.
        </p>
        <RecipePicker />
      </section>

      <div className="divider" />

      <section style={{ marginBottom: "4rem" }}>
        <div className="subsection-label">Explore</div>
        <div className="explore-grid">
          {exploreCards.map((page) => (
            <a className="explore-card" href={`#${page.path}`} key={page.path}>
              <span className="eyebrow">{page.eyebrow}</span>
              <h3>{page.heading}</h3>
              <p>{page.lede}</p>
              <span className="explore-arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
