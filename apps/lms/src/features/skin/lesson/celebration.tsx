"use client"

import { getLmsEngagementXp, type StepView } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import "../playful-lesson.css"

/** mm:ss of a whole number of seconds. */
function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

/**
 * The full-screen "Step complete" takeover: XP earned (the server's XP events for this lesson or this session),
 * accuracy (test points, or passed blocks for a lesson without tests) and time on the lesson. The server decides the
 * numbers; reduced motion turns the animations off in CSS.
 */
export function Celebration({
  step,
  startedAt,
  continueHref,
}: {
  step: StepView
  startedAt: number
  continueHref: string
}) {
  const t = useT("skin")
  const [seconds] = useState(() => Math.max(0, Math.round((Date.now() - startedAt) / 1000)))
  const refs = new Set([step.step_id, ...step.blocks.map((block) => block.id)])
  const xp = useQuery({
    queryKey: ["lms", "engagement", "xp", "celebration", step.step_id, startedAt],
    queryFn: () => getLmsEngagementXp({ limit: 50 }),
    retry: false,
  })
  const earned = xp.data?.items
    .filter((event) => refs.has(event.ref) || Date.parse(event.at) >= startedAt)
    .reduce((sum, event) => sum + event.xp, 0)
  const accuracy =
    step.points_total > 0
      ? Math.round((step.points_earned / step.points_total) * 100)
      : step.blocks_total > 0
        ? Math.round((step.blocks_passed / step.blocks_total) * 100)
        : 100

  const button = useRef<HTMLAnchorElement>(null)
  useEffect(() => button.current?.focus({ preventScroll: true }), [])

  return (
    <div
      className="pl-celebrate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pl-celebrate-title"
      data-testid="celebration"
    >
      <div className="pl-celebrate-mark" aria-hidden>
        <Icons.sparkles />
      </div>
      <h1 id="pl-celebrate-title">{t("celebrate.title")}</h1>
      <dl className="pl-stats">
        <div className="pl-stat">
          <dt>{t("celebrate.xp")}</dt>
          <dd>{earned === undefined ? "…" : `+${earned}`}</dd>
        </div>
        <div className="pl-stat">
          <dt>{t("celebrate.accuracy")}</dt>
          <dd>{accuracy}%</dd>
        </div>
        <div className="pl-stat">
          <dt>{t("celebrate.time")}</dt>
          <dd>{clock(seconds)}</dd>
        </div>
      </dl>
      <div className="pl-footer">
        <div className="pl-footer-inner">
          <Link ref={button} href={continueHref} className="pl-btn w-full md:ml-auto md:w-auto md:min-w-48">
            {t("lesson.continue")}
          </Link>
        </div>
      </div>
    </div>
  )
}
