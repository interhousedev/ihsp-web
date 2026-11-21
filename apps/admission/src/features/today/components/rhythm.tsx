"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { ProgressRing } from "../../../components/lib/page"

/** The daily streak with the last seven days, and the overall readiness. */
export function Rhythm({
  streak,
  readiness,
  className,
}: {
  streak: { days: number; last7: boolean[] }
  readiness: number
  className?: string
}) {
  const t = useT("today")
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-sm font-semibold">
          <span className="text-muted-foreground font-normal">{t("streak.title")}: </span>
          {t("streak.days", { n: streak.days })}
        </p>
        <ul className="flex gap-1.5" aria-label={t("streak.week")}>
          {streak.last7.map((done, index) => (
            <li
              key={index}
              title={done ? t("streak.done") : t("streak.missed")}
              className={cn("size-3 rounded-full", done ? "bg-primary" : "border-muted-foreground/50 border border-dashed")}
            >
              <span className="sr-only">{done ? t("streak.done") : t("streak.missed")}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-muted-foreground text-xs">{t("readiness.title")}</span>
        <ProgressRing percent={readiness} label={t("readiness.title")} size={44} className="[&_span]:text-xs md:[&_span]:text-sm" />
      </div>
    </div>
  )
}
