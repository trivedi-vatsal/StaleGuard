export type RecipeDef = {
  path: string;
  label: string;
  shortLabel: string;
  description: string;
};

export const recipes: RecipeDef[] = [
  {
    path: "/implementation",
    label: "Vite + static host",
    shortLabel: "Vite",
    description:
      "HEAD /index.html, ETag or Last-Modified, and a no-cache rule for the entry file.",
  },
  {
    path: "/nextjs",
    label: "Next.js App Router (self-hosted)",
    shortLabel: "Next.js",
    description:
      "/api/version build ID, focus check, and optional deploymentId for standalone containers.",
  },
];

export const findRecipe = (path: string) =>
  recipes.find((recipe) => recipe.path === path);
