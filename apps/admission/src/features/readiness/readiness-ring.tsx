"use client"

import { useT } from "@ihsp/i18n"
import { ProgressRing } from "../../components/lib/page"

/** The readiness percentage as a ring. */
export function ReadinessRing({
  percent,
  size = 128,
  className,
}: {
  percent: number
  size?: number
  className?: string
}) {
  const t = useT("home.readiness")
  return <ProgressRing percent={percent} label={t("title")} size={size} className={className} />
}
