import type { ReactNode } from "react";
import { DocsNav } from "./DocsNav";
import { RecipePicker } from "./RecipePicker";
import { findRecipe } from "../recipes";

type DocsShellProps = {
  current: string;
  children: ReactNode;
};

export function DocsShell({ current, children }: DocsShellProps) {
  const onRecipePage = Boolean(findRecipe(current));

  return (
    <div className="container page docs-shell">
      <aside className="docs-sidebar">
        <p className="docs-sidebar-title">Documentation</p>
        <DocsNav current={current} />
        <div className="docs-sidebar-recipes">
          <RecipePicker current={onRecipePage ? current : undefined} />
        </div>
      </aside>
      <div className="docs-main">{children}</div>
    </div>
  );
}
