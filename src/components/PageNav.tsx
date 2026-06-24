import { pages, pageIndex } from "../routes";

export function PageNav({ current }: { current: string }) {
  const index = pageIndex(current);
  const prev = index > 0 ? pages[index - 1] : null;
  const isLast = index === pages.length - 1;
  const next = isLast ? pages[0] : pages[index + 1];

  return (
    <nav className="pager" aria-label="Page navigation">
      {prev ? (
        <a className="pager-link pager-prev" href={`#${prev.path}`}>
          <span aria-hidden="true">←</span> {prev.label}
        </a>
      ) : (
        <span />
      )}
      <a className="pager-link pager-next" href={`#${next.path}`}>
        {isLast ? "Back to home" : next.label} <span aria-hidden="true">→</span>
      </a>
    </nav>
  );
}
