"use client"

import type { StepView } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ConfirmDialog, Icons } from "@ihsp/ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type RefObject } from "react"
import { StepContent } from "../../player/components/step-content"
import { TutorPanel } from "../../player/components/tutor-panel"
import type { NavTarget } from "../../player/utils/block-nav"
import { Celebration } from "./celebration"
import { useLessonSound } from "./tones"
import "../playful-lesson.css"

type Feedback = { correct: boolean; score: number; max: number }

/** Blocks the server grades: a step with any of them completes only once each is passed (as in Classic). */
const GRADABLE: Record<string, true> = { test: true, exam: true, code: true, h5p: true, interactive_video: true }

/** The first graded block still open; a test without attempts left no longer holds the lesson. */
function pendingBlock(step: StepView): number {
  if (step.preview) return -1
  return step.blocks.findIndex(
    (block) =>
      GRADABLE[block.type] === true && !block.passed && !(block.type === "test" && block.rules.attempts_left === 0),
  )
}

/**
 * The Playful lesson chrome around the same block content: close, a segmented progress bar (one segment per block)
 * and a sound toggle on top; Continue in a fixed footer that turns into a correct/incorrect sheet when a test attempt is
 * submitted. Graded tests keep their attempt semantics: the sheet only repeats the result the test already shows, no
 * answers. The last Continue opens the celebration. Exams never reach this component.
 */
export function PlayfulStepPlayer({
  step,
  index,
  courseId,
  slug,
  previous,
  next,
  hrefFor,
  pathHref,
}: {
  step: StepView
  index: number
  courseId: string
  slug: string | null
  previous: NavTarget | null
  next: NavTarget | null
  hrefFor: (target: NavTarget) => string
  pathHref: string
}) {
  const t = useT("skin")
  const sound = useLessonSound()
  const [startedAt] = useState(() => Date.now())
  const [celebrating, setCelebrating] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  // Close asks first; progress is already saved per block, so quitting only leaves the lesson.
  const [quitting, setQuitting] = useState(false)
  const router = useRouter()
  const current = step.blocks[index]

  // A new best attempt on a test block (a submit while this lesson is open) shows the feedback sheet.
  const seen = useRef<Map<string, string | null> | null>(null)
  const { play } = sound
  useEffect(() => {
    const attempts = new Map(
      step.blocks.flatMap((block) => (block.type === "test" ? [[block.id, block.best?.id ?? null] as const] : [])),
    )
    const before = seen.current
    seen.current = attempts
    if (before === null) return
    for (const block of step.blocks) {
      if (block.type !== "test" || !block.best || before.get(block.id) === block.best.id) continue
      setFeedback({ correct: block.best.passed, score: block.best.score, max: block.best.max_score })
      play(block.best.passed ? "correct" : "wrong")
      return
    }
  }, [step.blocks, play])

  const inStep = next?.kind === "step"
  const primary = useRef<HTMLElement>(null)
  const pending = pendingBlock(step)
  // Inside the lesson Continue is a link (the course shell moves to it in place); at the end it opens the celebration,
  // but only once every graded block is done: an unsubmitted test sends the learner to it instead.
  const finish = () => {
    setFeedback(null)
    play("complete")
    setCelebrating(true)
  }

  // Enter = Continue, unless the learner is typing or on another control.
  useEffect(() => {
    if (celebrating) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.defaultPrevented) return
      const target = event.target
      if (target instanceof Element && target.closest("input, textarea, select, button, a, [contenteditable], iframe"))
        return
      event.preventDefault()
      primary.current?.click()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [celebrating])

  if (celebrating) {
    return <Celebration step={step} startedAt={startedAt} continueHref={next ? hrefFor(next) : pathHref} />
  }

  const tone = feedback && !feedback.correct ? "wrong" : undefined
  const label = feedback && !feedback.correct ? t("lesson.gotIt") : t("lesson.continue")

  return (
    <div className="pl-lesson" data-testid="playful-lesson">
      <header className="pl-topbar">
        <button type="button" className="pl-icon-btn" aria-label={t("lesson.close")} onClick={() => setQuitting(true)}>
          <Icons.close aria-hidden />
        </button>
        <ConfirmDialog
          open={quitting}
          onOpenChange={setQuitting}
          title={t("lesson.quitTitle")}
          description={t("lesson.quitDescription")}
          confirmLabel={t("lesson.quit")}
          cancelLabel={t("lesson.stay")}
          onConfirm={() => router.push(pathHref)}
        />
        <ol
          className="pl-progress"
          role="progressbar"
          aria-label={t("lesson.progress")}
          aria-valuemin={0}
          aria-valuemax={step.blocks.length}
          aria-valuenow={step.blocks.filter((block) => block.passed).length}
        >
          {step.blocks.map((block, position) => (
            <li
              key={block.id}
              className="pl-seg"
              data-state={block.passed ? "done" : position === index ? "current" : "todo"}
            >
              <span />
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="pl-icon-btn"
          aria-pressed={sound.on}
          aria-label={t("lesson.sound")}
          onClick={sound.toggle}
        >
          <Icons.music aria-hidden />
        </button>
      </header>

      <main className="pl-lesson-body">
        <p className="pl-lesson-title">{step.title}</p>
        {current ? (
          <StepContent
            block={current}
            courseId={courseId}
            stepId={step.step_id}
            slug={slug}
            preview={step.preview}
            focusKey={`${step.step_id}:${index}`}
          />
        ) : (
          <p className="px-4 py-5 text-sm opacity-70">{t("lesson.empty")}</p>
        )}
        {/* The same tutor as in Classic; this player never opens for previews or guests. */}
        {current && !step.preview ? <TutorPanel stepId={step.step_id} /> : null}
      </main>

      <footer className="pl-footer" data-feedback={feedback ? (feedback.correct ? "correct" : "wrong") : undefined}>
        <div className="pl-footer-inner">
          {feedback ? (
            <div role="status" aria-live="polite" data-testid="feedback-sheet">
              <p className="pl-feedback-title">
                {feedback.correct ? <Icons.circleCheck aria-hidden /> : <Icons.circleX aria-hidden />}
                {feedback.correct ? t("lesson.correct") : t("lesson.wrong")}
              </p>
              <p className="text-sm font-semibold">{t("lesson.score", { score: feedback.score, max: feedback.max })}</p>
            </div>
          ) : previous ? (
            <Link
              href={hrefFor(previous)}
              prefetch={false}
              rel="prev"
              className="pl-back hidden items-center md:inline-flex"
            >
              {t("lesson.back")}
            </Link>
          ) : (
            <span className="hidden md:block" />
          )}
          {inStep && next ? (
            <Link
              ref={primary as RefObject<HTMLAnchorElement>}
              href={hrefFor(next)}
              prefetch={false}
              rel="next"
              className="pl-btn w-full md:w-auto md:min-w-48"
              data-tone={tone}
              onClick={() => setFeedback(null)}
            >
              {label}
            </Link>
          ) : pending >= 0 ? (
            <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:items-end">
              <p role="status" className="text-sm font-semibold" data-testid="lesson-pending">
                {t("lesson.pending")}
              </p>
              {pending === index ? null : (
                <Link
                  ref={primary as RefObject<HTMLAnchorElement>}
                  href={hrefFor({ kind: "step", stepId: step.step_id, block: pending })}
                  prefetch={false}
                  className="pl-btn w-full md:w-auto md:min-w-48"
                  onClick={() => setFeedback(null)}
                >
                  {t("lesson.toTask")}
                </Link>
              )}
            </div>
          ) : (
            <button
              ref={primary as RefObject<HTMLButtonElement>}
              type="button"
              className="pl-btn w-full md:w-auto md:min-w-48"
              data-tone={tone}
              onClick={finish}
            >
              {label}
            </button>
          )}
          {previous && !feedback ? (
            <Link
              href={hrefFor(previous)}
              prefetch={false}
              rel="prev"
              className="pl-back inline-flex items-center md:hidden"
            >
              {t("lesson.back")}
            </Link>
          ) : null}
        </div>
      </footer>
    </div>
  )
}
