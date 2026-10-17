"use client"

import { getLmsH5PLaunchQuery, postLmsH5PResult, type BlockResult, type LearningH5PBlock } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { h5pBaseUrl, h5pPlayerSrc, H5P_SANDBOX, parsePlayerMessage } from "../utils/h5p"

/**
 * An H5P package played with h5p-standalone inside a sandboxed iframe (scripts only, opaque origin: package code cannot
 * touch the LMS origin, its storage or cookies). The files come from a signed path of the API; the root `completed` /
 * `answered` xAPI statements are sent to the server, which keeps the best score of the block.
 */
export function H5PBlock({
  block,
  courseId,
  stepId,
  preview,
}: {
  block: LearningH5PBlock
  courseId: string
  stepId: string
  preview: boolean
}) {
  const t = useT("player")
  const launch = useQuery({
    ...getLmsH5PLaunchQuery(courseId, stepId, block.id, preview),
    enabled: block.package_id !== "",
    staleTime: 30 * 60_000, // the signed path lives for hours
    refetchOnWindowFocus: false,
    retry: false,
  })
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(480)
  const [result, setResult] = useState<BlockResult | null>(block.result ?? null)
  const base = launch.data ? h5pBaseUrl(launch.data.base_url) : null

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = parsePlayerMessage(event, frame.current?.contentWindow)
      if (!message) return
      if (message.kind === "size") return setHeight(Math.ceil(message.height))
      if (preview) return
      void postLmsH5PResult(stepId, block.id, message.statement)
        .then(setResult)
        .catch(() => undefined)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [block.id, preview, stepId])

  if (!block.package_id || launch.isError) {
    return <p className="text-muted-foreground text-sm">{t("h5p.unavailable")}</p>
  }
  return (
    <figure className="flex flex-col gap-2" data-h5p={block.id}>
      {launch.isPending ? <div className="bg-muted aspect-video w-full animate-pulse rounded-lg" aria-hidden /> : null}
      {base ? (
        <iframe
          ref={frame}
          src={h5pPlayerSrc(base, block.id)}
          sandbox={H5P_SANDBOX}
          title={block.title || t("h5p.title")}
          className="w-full rounded-lg border-0"
          style={{ height }}
          allowFullScreen
        />
      ) : null}
      {result && result.max_score > 0 ? (
        <figcaption role="status" className="text-muted-foreground text-sm">
          {t("h5p.score", { score: result.score, max: result.max_score })}
        </figcaption>
      ) : null}
    </figure>
  )
}
