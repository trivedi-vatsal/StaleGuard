import { Logo } from "./Logo";
import { pages } from "../routes";

const repoUrl = "https://github.com/trivedi-vatsal/StaleGuard";
const agentGuideUrl = "https://vatsal.xyz/StaleGuard/AGENT_GUIDE.md";
const publishedUrl = "https://vatsal.xyz/StaleGuard/";
const authorUrl = "https://vatsal.xyz/";
const projectVersion = "0.1.0";

const columns = [
  {
    title: "Product",
    links: pages
      .filter((page) => page.path !== "/")
      .map((page) => ({ label: page.label, href: `#${page.path}` })),
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: repoUrl },
      { label: "AGENT_GUIDE.md", href: agentGuideUrl },
      { label: "Live site", href: publishedUrl },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo />
            <p className="footer-tagline">
              A drop-in hook for silent stale-deployment recovery in Vite +
              React apps - no banners, no polling, no user friction.
            </p>
          </div>
          {columns.map(({ title, links }) => (
            <nav aria-label={title} key={title}>
              <p className="footer-col-title">{title}</p>
              <ul className="footer-col-links">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noreferrer" : undefined}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="footer-bottom">
          <p>© 2026 StaleGuard. MIT licensed.</p>
          <p>
            Built by{" "}
            <a href={authorUrl} target="_blank" rel="noreferrer">
              Vatsal Trivedi
            </a>{" "}
            · v{projectVersion}
          </p>
        </div>
      </div>
    </footer>
  );
}
