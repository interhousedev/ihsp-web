"use client"

import { Button, Icons, cn } from "@ihsp/ui"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { QuestionField } from "./fields"
import { canAdvance } from "./logic"
import type { StepAnswers, StepQuestion, StepValue } from "./types"

export type StepperLabels = {
  back: string
  next: string
  finish: string
  saving: string
  saveError: string
  /** "Question 3 of 13". */
  step: (current: number, total: number) => string
  /** Accessible name of the progress bar. */
  progress: string
}

export type StepperWizardProps = {
  questions: StepQuestion[]
  answers: StepAnswers
  onAnswer: (id: string, value: StepValue) => void
  /** First step to show (see `firstUnanswered`); clamped to the last question. */
  initialStep?: number
  /** Awaited before moving on (the page saves the answer here); a rejection keeps the step and shows `saveError`. */
  onStepDone?: (question: StepQuestion, answers: StepAnswers) => Promise<unknown> | void
  /** Next on the last question, after `onStepDone`. */
  onFinish: () => void
  labels: StepperLabels
  className?: string
}

/** Segments of the progress bar: one per section, each filled by the answered share of its questions. */
function sectionSegments(questions: StepQuestion[], step: number) {
  const segments: { section: string; label: string; first: number; last: number }[] = []
  questions.forEach((question, index) => {
    const tail = segments[segments.length - 1]
    if (tail && tail.section === question.section) tail.last = index
    else segments.push({ section: question.section, label: question.sectionLabel, first: index, last: index })
  })
  return segments.map((segment) => {
    const size = segment.last - segment.first + 1
    const done = Math.min(Math.max(step - segment.first, 0), size)
    return { ...segment, fill: done / size }
  })
}

/**
 * One question per screen: progress (linear on phones, segmented by section from tablet width), the section eyebrow,
 * the question as a card / chip / select field, Back and Next (disabled until the question is answered). The
 * question's `guide` is one muted line under the title.
 */
export function StepperWizard({
  questions,
  answers,
  onAnswer,
  initialStep = 0,
  onStepDone,
  onFinish,
  labels,
  className,
}: StepperWizardProps) {
  const [step, setStep] = useState(() => Math.min(Math.max(initialStep, 0), Math.max(questions.length - 1, 0)))
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) heading.current?.focus()
    mounted.current = true
  }, [step])

  const question = questions[step]
  if (!question) return null
  const last = step === questions.length - 1
  const ready = canAdvance(question, answers) && !busy
  const segments = sectionSegments(questions, step)

  async function next(event?: FormEvent) {
    event?.preventDefault()
    if (!ready) return
    setBusy(true)
    setFailed(false)
    try {
      await onStepDone?.(question, answers)
    } catch {
      setFailed(true)
      setBusy(false)
      return
    }
    setBusy(false)
    if (last) onFinish()
    else setStep(step + 1)
  }

  return (
    <section className={cn("flex w-full flex-col gap-5", className)} aria-label={labels.progress}>
      <div
        role="progressbar"
        aria-label={labels.progress}
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={step + 1}
        aria-valuetext={labels.step(step + 1, questions.length)}
      >
        <div className="bg-muted h-1.5 overflow-hidden rounded-full md:hidden">
          <div
            className="bg-primary h-full transition-[width] motion-reduce:transition-none"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
        <ol className="hidden gap-2 md:flex" aria-hidden>
          {segments.map((segment) => (
            <li key={segment.section} className="flex-1" style={{ flexGrow: segment.last - segment.first + 1 }}>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-[width] motion-reduce:transition-none"
                  style={{ width: `${segment.fill * 100}%` }}
                />
              </div>
              <span
                className={cn(
                  "mt-1.5 block truncate text-xs",
                  segment.section === question.section ? "font-medium" : "text-muted-foreground",
                )}
              >
                {segment.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="w-full max-w-2xl">
        <form onSubmit={(event) => void next(event)} className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {question.sectionLabel} · {labels.step(step + 1, questions.length)}
            </p>
            <h2 ref={heading} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none md:text-3xl">
              {question.title}
            </h2>
            {question.guide ? <p className="text-muted-foreground text-sm">{question.guide}</p> : null}
          </header>
          <QuestionField
            key={question.id}
            question={question}
            value={answers[question.id] ?? ""}
            onChange={(value) => onAnswer(question.id, value)}
            disabled={busy}
          />
          {failed ? (
            <p role="alert" className="text-destructive text-sm">
              {labels.saveError}
            </p>
          ) : null}
          <div className="bg-background/95 sticky bottom-0 -mx-4 flex items-center justify-between gap-2 border-t px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
            <Button type="button" variant="outline" disabled={step === 0 || busy} onClick={() => setStep(step - 1)}>
              <Icons.chevronLeft />
              {labels.back}
            </Button>
            <Button type="submit" disabled={!ready}>
              {busy ? labels.saving : last ? labels.finish : labels.next}
              {busy ? null : <Icons.chevronRight />}
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
