import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const publicDir = join(root, "public");

const sections = [
  ["# StaleGuard — full documentation export", ""],
  [
    "AGENT_GUIDE.md",
    readFileSync(join(publicDir, "AGENT_GUIDE.md"), "utf8"),
  ],
  [
    "docs/how-it-works.md",
    readFileSync(join(publicDir, "docs/how-it-works.md"), "utf8"),
  ],
  [
    "docs/implementation.md",
    readFileSync(join(publicDir, "docs/implementation.md"), "utf8"),
  ],
  [
    "docs/edge-cases.md",
    readFileSync(join(publicDir, "docs/edge-cases.md"), "utf8"),
  ],
  [
    "docs/nextjs-app-router.md",
    readFileSync(join(publicDir, "docs/nextjs-app-router.md"), "utf8"),
  ],
];

const body = sections
  .map(([title, content]) => {
    if (!content) return `${title}\n\nGenerated from repository markdown under public/.`;
    return `\n\n---\n\n<!-- ${title} -->\n\n${content.trim()}\n`;
  })
  .join("");

writeFileSync(join(publicDir, "llms-full.txt"), `${body.trim()}\n`, "utf8");
console.log("Wrote public/llms-full.txt");
