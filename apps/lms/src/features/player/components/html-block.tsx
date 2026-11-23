"use client"

import { getLmsHtmlWidgetLaunchQuery, postLmsWidgetResult, type BlockResult, type LearningHtmlBlock } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { refreshProgress } from "../utils/fresh"
import { HTML_WIDGET_SANDBOX, clampWidgetHeight, htmlWidgetUrl, parseWidgetMessage } from "../utils/html-widget"

/**
 * An author-uploaded HTML widget in a sandboxed iframe (scripts only, opaque origin): it cannot read the
 * LMS page, its cookies or storage, navigate the tab or reach the network (the served CSP has `connect-src 'none'`).
 * It talks to the page only through `postMessage` (`ihsp-widget-size`, `ihsp-widget-result`); a graded widget's score
 * is sent to the server, which keeps the best one.
 */
export function HtmlBlock({
  block,
  courseId,
  stepId,
  mode,
  slug,
}: {
  block: LearningHtmlBlock
  courseId: string
  stepId: string
  mode: "learn" | "preview"
  slug: string | null
}) {
  const t = useT("player")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const launch = useQuery({
    ...getLmsHtmlWidgetLaunchQuery(courseId, stepId, block.id, mode === "preview", block.package_id),
    enabled: block.package_id !== "",
    staleTime: 30 * 60_000, // the signed URL lives for an hour
    refetchOnWindowFocus: false,
    retry: false,
  })
  const frame = useRef<HTMLIFrameElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(() => clampWidgetHeight(block.height_px))
  const [result, setResult] = useState<BlockResult | null>(block.result ?? null)
  const [passed, setPassed] = useState(block.passed)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = parseWidgetMessage(event, frame.current?.contentWindow)
      if (!message) return
      if (message.kind === "size") return setHeight(message.height)
      if (mode !== "learn" || !block.graded) return
      void postLmsWidgetResult(courseId, stepId, block.id, { score_pct: message.scorePct, passed: message.passed })
        .then((saved) => {
          void refreshProgress(queryClient, { courseId, stepId, slug })
          setResult(saved)
          if (message.passed) setPassed(true)
        })
        .catch(() => undefined)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [block.graded, block.id, courseId, mode, queryClient, slug, stepId])

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === wrapper.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
    else void wrapper.current?.requestFullscreen().catch(() => undefined)
  }

  if (!block.package_id || launch.isError) {
    return <p className="text-muted-foreground text-sm">{t("html.unavailable")}</p>
  }
  const title = block.title || t("html.title")
  return (
    <figure className="flex flex-col gap-2" data-html-widget={block.id}>
      {block.title || block.allow_fullscreen ? (
        <div className="flex items-center justify-between gap-2">
          {block.title ? <figcaption className="text-sm font-medium">{block.title}</figcaption> : <span />}
          {block.allow_fullscreen ? (
            <Button type="button" variant="ghost" size="sm" onClick={toggleFullscreen} aria-pressed={fullscreen}>
              <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                <path
                  d={fullscreen ? "M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"}
                />
              </svg>
              {fullscreen ? t("html.exitFullscreen") : t("html.fullscreen")}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div ref={wrapper} className="bg-background w-full overflow-hidden rounded-lg border">
        {launch.isPending ? (
          <div className="bg-muted w-full animate-pulse" style={{ height }} aria-hidden />
        ) : launch.data ? (
          <iframe
            ref={frame}
            src={`${htmlWidgetUrl(launch.data.entry_url)}#lang=${locale}&theme=${
              typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"
            }`}
            sandbox={HTML_WIDGET_SANDBOX}
            referrerPolicy="no-referrer"
            loading="lazy"
            title={title}
            className="block w-full border-0"
            style={{ height: fullscreen ? "100vh" : height }}
          />
        ) : null}
      </div>
      {mode === "learn" && block.graded && (result || passed) ? (
        <p role="status" className="text-muted-foreground text-sm">
          {passed ? t("html.passed") : null}
          {passed && result && result.max_score > 0 ? " · " : null}
          {result && result.max_score > 0 ? t("html.score", { score: result.score, max: result.max_score }) : null}
        </p>
      ) : null}
    </figure>
  )
}
