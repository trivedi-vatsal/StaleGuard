import { PageHeader } from "../components/PageHeader";
import { PageNav } from "../components/PageNav";
import { DocsNav } from "../components/DocsNav";
import { RecipePicker } from "../components/RecipePicker";
import { FileExplorer } from "../components/FileExplorer";
import { findPage } from "../routes";

const page = findPage("/nextjs")!;

const codeVersionRoute = `import { readFileSync } from "node:fs"
import path from "node:path"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

let buildId: string | null | undefined

function readBuildId(): string | null {
  if (buildId === undefined) {
    try {
      buildId = readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim() || null
    } catch {
      buildId = null
    }
  }
  return buildId
}

export async function GET() {
  return NextResponse.json(
    { buildId: process.env.NEXT_DEPLOYMENT_ID || readBuildId() },
    { headers: { "Cache-Control": "no-store" } }
  )
}`;

const codeHook = `"use client"

import { useEffect, useRef } from "react"

export function useVersionCheck() {
  const baseline = useRef<string | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" })
        if (!res.ok) return
        const { buildId } = (await res.json()) as { buildId: string | null }
        if (!buildId) return
        if (!baseline.current) {
          baseline.current = buildId
          return
        }
        if (buildId === baseline.current) return
        if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return
        window.location.reload()
      } catch {
        // Offline or mid-restart: retry on next focus.
      }
    }

    void check()
    window.addEventListener("focus", check)
    return () => window.removeEventListener("focus", check)
  }, [])
}`;

const codeDocker = `ARG SOURCE_COMMIT=
ENV NEXT_DEPLOYMENT_ID=$SOURCE_COMMIT

RUN npm run build`;

const files = [
  { path: "src/app/api/version/route.ts", code: codeVersionRoute },
  { path: "src/hooks/use-version-check.ts", code: codeHook },
  { path: "Dockerfile (builder stage)", code: codeDocker },
];

export function NextJs() {
  return (
    <div className="container page">
      <DocsNav current={page.path} />
      <RecipePicker current={page.path} />
      <PageHeader
        eyebrow={page.eyebrow}
        heading={page.heading}
        lede={page.lede}
      />

      <p className="step-note">
        Full step-by-step guide (verification tables, Docker, middleware, optional
        poll cleanup):{" "}
        <a href="./docs/nextjs-app-router.md">docs/nextjs-app-router.md</a> —
        plain text, safe to hand to an AI agent.
      </p>

      <div className="step-card">
        <div className="step-head">
          <span className="step-badge">01</span>
          <span className="step-title">Version API route</span>
        </div>
        <p className="step-desc">
          There is no <code>index.html</code> to HEAD. Expose the build the server
          is running via <code>/api/version</code> with <code>no-store</code>. Prefer{" "}
          <code>NEXT_DEPLOYMENT_ID</code> once you set a deployment ID at build
          time — Next pins <code>BUILD_ID</code> to a constant when that is on.
        </p>
      </div>

      <div className="step-card">
        <div className="step-head">
          <span className="step-badge">02</span>
          <span className="step-title">Focus hook</span>
        </div>
        <p className="step-desc">
          Same baseline-on-first-load pattern as the Vite recipe, but JSON from
          the API. Skips reload while a dialog is open; pages with{" "}
          <code>beforeunload</code> guards still get the browser prompt.
        </p>
      </div>

      <div className="step-card">
        <div className="step-head">
          <span className="step-badge">03</span>
          <span className="step-title">Root providers + public middleware</span>
        </div>
        <p className="step-desc">
          Call the hook once from your client <code>Providers</code> wrapper. Add{" "}
          <code>/api/version</code> to public routes so expired sessions do not
          break the check.
        </p>
      </div>

      <div className="step-card">
        <div className="step-head">
          <span className="step-badge">04</span>
          <span className="step-title">deploymentId at build time</span>
        </div>
        <p className="step-desc">
          Pass a git commit SHA as <code>NEXT_DEPLOYMENT_ID</code> in the Docker
          builder stage. Next then full-page-loads on navigation when the tab
          never lost focus — no extra polling.
        </p>
      </div>

      <FileExplorer files={files} />

      <PageNav current={page.path} />
    </div>
  );
}
