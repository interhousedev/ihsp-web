"use client"

import type { CoursePage } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons, StateView } from "@ihsp/ui"
import Link from "next/link"
import { hrefs } from "../../shared/utils/hrefs"
import { continueStep } from "../../shared/utils/outline"
import "../playful-lesson.css"

type NodeState = "done" | "current" | "available" | "locked"

/** Horizontal offset of the n-th node of a section: a gentle wave of ±48 px. */
function waveOffset(index: number): number {
  return Math.round(Math.sin((index * Math.PI) / 3) * 48)
}

/**
 * The Playful home of a course: one banner per section and its lessons as a zig-zag path of round nodes (done, current,
 * open, locked). A later section the learner has not reached yet offers "Jump here" to its first open lesson.
 */
export function CoursePath({ page }: { page: CoursePage }) {
  const t = useT("skin")
  const current = continueStep(page.outline)?.step_id ?? null
  const currentSection = page.outline.findIndex((section) => section.steps.some((step) => step.step_id === current))

  if (page.outline.every((section) => section.steps.length === 0)) {
    return <StateView state="empty" title={t("path.empty")} />
  }

  return (
    <div className="pl-path" data-testid="course-path">
      <h1 className="mb-4 text-2xl font-extrabold">{page.title}</h1>
      {page.outline.map((section, sectionIndex) => {
        const done = section.steps.filter((step) => step.completed).length
        const jump =
          sectionIndex > currentSection ? section.steps.find((step) => !step.locked && !step.completed) : undefined
        return (
          <section key={section.id} aria-labelledby={`pl-section-${section.id}`}>
            <header className="pl-banner flex items-center justify-between gap-3" data-tone={sectionIndex % 4}>
              <div className="min-w-0">
                <p className="text-xs font-extrabold tracking-wide uppercase opacity-90">
                  {t("path.section", { number: sectionIndex + 1 })}
                </p>
                <h2 id={`pl-section-${section.id}`} className="text-lg font-extrabold break-words text-balance">
                  {section.title}
                </h2>
                <p className="text-sm font-semibold opacity-90">
                  {t("path.sectionProgress", { done, total: section.steps.length })}
                </p>
              </div>
              {jump ? (
                <Link href={hrefs.step(page.id, jump.step_id)} prefetch={false} className="pl-jump shrink-0">
                  {t("path.jumpHere")}
                </Link>
              ) : null}
            </header>
            <ol className="pl-nodes">
              {section.steps.map((step, index) => {
                const state: NodeState = step.locked
                  ? "locked"
                  : step.step_id === current
                    ? "current"
                    : step.completed
                      ? "done"
                      : "available"
                const Icon =
                  state === "locked"
                    ? Icons.lock
                    : state === "done"
                      ? Icons.check
                      : state === "current"
                        ? Icons.play
                        : Icons.page
                const label = `${step.title}. ${t(`path.state.${state}`)}`
                return (
                  <li
                    key={step.step_id}
                    className="pl-node-wrap"
                    data-state={state}
                    style={{ transform: `translateX(${waveOffset(index)}px)` }}
                  >
                    {state === "current" ? (
                      <span className="pl-bubble" aria-hidden>
                        {done === 0 && sectionIndex === 0 ? t("path.start") : t("path.continue")}
                      </span>
                    ) : null}
                    {state === "locked" ? (
                      <span className="pl-node" data-state={state} role="img" aria-label={label}>
                        <Icon aria-hidden />
                      </span>
                    ) : (
                      <Link
                        href={hrefs.step(page.id, step.step_id)}
                        prefetch={false}
                        className="pl-node"
                        data-state={state}
                        aria-label={label}
                        aria-current={state === "current" ? "step" : undefined}
                      >
                        <Icon aria-hidden />
                      </Link>
                    )}
                    <span className="pl-node-label" aria-hidden>
                      {step.title}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
