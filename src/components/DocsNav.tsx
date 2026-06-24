import { pages } from "../routes";

const docsPages = pages.filter((page) => page.path !== "/");

export function DocsNav({ current }: { current: string }) {
  return (
    <nav className="docs-nav" aria-label="Docs sections">
      <ul>
        {docsPages.map((page) => (
          <li key={page.path}>
            <a
              href={`#${page.path}`}
              aria-current={current === page.path ? "page" : undefined}
              className={current === page.path ? "active" : undefined}
            >
              {page.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
