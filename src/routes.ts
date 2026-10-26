export type RouteDef = {
  path: string;
  label: string;
  eyebrow: string;
  heading: string;
  lede: string;
};

export const pages: RouteDef[] = [
  {
    path: "/",
    label: "Home",
    eyebrow: "Overview",
    heading: "No stale builds.",
    lede: "One hook. One cache header. Silent reload on tab focus.",
  },
  {
    path: "/how-it-works",
    label: "How it works",
    eyebrow: "How it works",
    heading: "Six steps, one reload",
    lede: "From a fresh deploy to a silent refresh - no banner, no prompt, no timer.",
  },
  {
    path: "/implementation",
    label: "Vite recipe",
    eyebrow: "Vite recipe",
    heading: "Three files. Copy, paste, done.",
    lede: "Static host + Vite: one cache header, one hook, reload on tab focus. No build plugins or extra infrastructure.",
  },
  {
    path: "/nextjs",
    label: "Next.js recipe",
    eyebrow: "Next.js recipe",
    heading: "App Router, self-hosted",
    lede: "Standalone Docker: /api/version, focus check, and Next deploymentId — layered protection without polling.",
  },
  {
    path: "/diagnostics",
    label: "Diagnostics",
    eyebrow: "Live diagnostics",
    heading: "Watch the hook in real time",
    lede: "This panel is wired to the real hook running on this page - run a check or switch tabs and come back.",
  },
  {
    path: "/edge-cases",
    label: "Edge cases",
    eyebrow: "Edge cases",
    heading: "Where it could break - and why it doesn't",
    lede: "Every failure mode is accounted for, not papered over.",
  },
];

export const findPage = (path: string) =>
  pages.find((page) => page.path === path);

export const pageIndex = (path: string) =>
  pages.findIndex((page) => page.path === path);
