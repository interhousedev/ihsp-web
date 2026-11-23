"use client"

import type { CourseMastery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Icons, Progress, cn } from "@ihsp/ui"
import Link from "next/link"

export type MasteryMapProps = {
  mastery: CourseMastery
  /** Where a step opens (the lesson player). */
  stepHref: (stepId: string) => string
  className?: string
}

/**
 * Sections as a vertical path with their mastery. With unlock-at-mastery on, a locked section shows the threshold the
 * previous one must reach.
 */
export function MasteryMap({ mastery, stepHref, className }: MasteryMapProps) {
  const t = useT("engagement")
  const threshold = mastery.unlock_threshold_pct
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-muted-foreground text-sm">
        {threshold === null ? t("mastery.noUnlock") : t("mastery.unlockRule", { pct: threshold })}
      </p>
      <ol className="flex flex-col gap-3">
        {mastery.sections.map((section, index) => (
          <li
            key={section.section_id}
            className={cn("rounded-card flex flex-col gap-2 border p-4", !section.unlocked && "bg-muted/40")}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <span
                  aria-hidden
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                    section.unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {section.unlocked ? index + 1 : <Icons.lock className="size-4" />}
                </span>
                {section.title}
              </h2>
              <Badge
                variant={(section.mastery_pct ?? 0) >= (threshold ?? 100) ? "default" : "outline"}
                className="shrink-0"
              >
                {t("mastery.pct", { pct: section.mastery_pct ?? 0 })}
              </Badge>
            </div>
            <Progress
              value={section.mastery_pct ?? 0}
              aria-label={t("mastery.sectionProgress", { title: section.title })}
            />
            {section.unlocked ? (
              <ul className="flex flex-col">
                {section.steps.map((step) => (
                  <li key={step.step_id}>
                    <Link
                      href={stepHref(step.step_id)}
                      className="hover:bg-muted flex min-h-11 items-center justify-between gap-2 rounded-md px-2 text-sm md:min-h-9"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {step.completed ? (
                          <Icons.circleCheck
                            aria-label={t("mastery.completed")}
                            className="text-primary size-4 shrink-0"
                          />
                        ) : (
                          <Icons.circle aria-hidden className="text-muted-foreground size-4 shrink-0" />
                        )}
                        <span className="truncate">{step.title}</span>
                      </span>
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        {step.best_pct === null ? "—" : t("mastery.pct", { pct: step.best_pct })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                {t("mastery.locked", { pct: threshold ?? 0, count: section.steps.length })}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
