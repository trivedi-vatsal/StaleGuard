import { useMemo, useState } from "react";
import { CopyButton } from "./CopyButton";

export interface ExplorerFile {
  path: string;
  code: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const path of paths) {
    const parts = path.split("/");
    let level = root;
    let acc = "";

    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1;
      const type: TreeNode["type"] = isFile ? "file" : "folder";
      let node = level.find((n) => n.name === part && n.type === type);

      if (!node) {
        node = { name: part, path: acc, type, children: isFile ? undefined : [] };
        level.push(node);
      }

      if (!isFile) level = node.children!;
    });
  }

  return root;
}

const FolderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.379a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 12.12 7H19.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11Z"
      fill="currentColor"
      opacity="0.55"
    />
  </svg>
);

const FileIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5L13.5 3Z" />
    <path d="M13 3.5V8a1 1 0 0 0 1 1h4.5" />
  </svg>
);

const TOKEN_PATTERN =
  /(?<comment>\/\/[^\n]*)|(?<string>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(?<tagPunct><\/?)(?<tag>[A-Z][\w.]*)|(?<keyword>\b(?:import|from|export|default|function|return|const|let|var|if|else|try|catch|async|await|new|void|typeof|class|extends|interface|type)\b)|(?<func>[A-Za-z_$][\w$]*)(?=\s*\()/g;

function highlight(code: string) {
  const nodes: { text: string; cls?: string }[] = [];
  let lastIndex = 0;

  for (const match of code.matchAll(TOKEN_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) nodes.push({ text: code.slice(lastIndex, start) });

    const g = match.groups!;
    if (g.comment) nodes.push({ text: g.comment, cls: "tok-comment" });
    else if (g.string) nodes.push({ text: g.string, cls: "tok-string" });
    else if (g.tag) {
      nodes.push({ text: g.tagPunct });
      nodes.push({ text: g.tag, cls: "tok-tag" });
    } else if (g.keyword) nodes.push({ text: g.keyword, cls: "tok-keyword" });
    else if (g.func) nodes.push({ text: g.func, cls: "tok-func" });

    lastIndex = start + match[0].length;
  }

  if (lastIndex < code.length) nodes.push({ text: code.slice(lastIndex) });
  return nodes;
}

function FileTree({
  nodes,
  depth,
  activePath,
  onSelect,
}: {
  nodes: TreeNode[];
  depth: number;
  activePath: string;
  onSelect: (path: string) => void;
}) {
  return (
    <div className="file-tree-children">
      {nodes.map((node) =>
        node.type === "folder" ? (
          <div key={node.path}>
            <div
              className="file-tree-row is-folder"
              style={{ paddingLeft: 8 + depth * 14 }}
            >
              <span className="file-tree-icon">
                <FolderIcon />
              </span>
              {node.name}
            </div>
            <FileTree
              nodes={node.children!}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          </div>
        ) : (
          <button
            key={node.path}
            type="button"
            className={`file-tree-row is-file${node.path === activePath ? " is-active" : ""}`}
            style={{ paddingLeft: 8 + depth * 14 }}
            onClick={() => onSelect(node.path)}
          >
            <span className="file-tree-icon">
              <FileIcon />
            </span>
            {node.name}
          </button>
        ),
      )}
    </div>
  );
}

export function FileExplorer({ files }: { files: ExplorerFile[] }) {
  const [activePath, setActivePath] = useState(files[0].path);
  const tree = useMemo(() => buildTree(files.map((f) => f.path)), [files]);
  const active = files.find((f) => f.path === activePath) ?? files[0];
  const tokens = useMemo(() => highlight(active.code), [active.code]);

  return (
    <div className="file-explorer">
      <div className="file-explorer-sidebar">
        <div className="file-explorer-sidebar-label">Files</div>
        <FileTree nodes={tree} depth={0} activePath={activePath} onSelect={setActivePath} />
      </div>
      <div className="file-explorer-main">
        <div className="file-explorer-tabbar">
          <span className="file-explorer-tab-name">{active.path.split("/").pop()}</span>
          <CopyButton text={active.code} />
        </div>
        <pre className="file-explorer-body">
          <code>
            {tokens.map((t, i) =>
              t.cls ? (
                <span key={i} className={t.cls}>
                  {t.text}
                </span>
              ) : (
                <span key={i}>{t.text}</span>
              ),
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
