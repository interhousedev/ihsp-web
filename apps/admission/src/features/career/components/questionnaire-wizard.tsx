"use client"

import { Button, Icons, Textarea, cn } from "@ihsp/ui"
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { QuestionField, canAdvance, type StepQuestion, type StepValue } from "../../../components/stepper"

export type QuestionnaireQuestion = StepQuestion & {
  /** An optional short free-text line next to the chips; its answer key is `textKey`. */
  textKey?: string
  textLabel?: string
  textPlaceholder?: string
  /** Most picks of a multi question. */
  max?: number
}

/** What a voice-fill (or any other input helper) gets to work with: the question and its free-text line. */
export type QuestionnaireExtraContext = {
  question: QuestionnaireQuestion
  text: string
  setText: (text: string) => void
}

export type QuestionnaireLabels = {
  back: string
  next: string
  finish: string
  saving: string
  saveError: string
  step: (current: number, total: number) => string
  progress: string
}

type Props = {
  questions: QuestionnaireQuestion[]
  answers: Record<string, string | number | boolean | string[]>
  /** One answer: a question id (chips / single) or a `textKey` (free text, on leaving the question). */
  onAnswer: (key: string, value: string | string[]) => void
  /** Awaited after the last question with the free-text lines typed so far (by `textKey`); a rejection keeps the step. */
  onFinish: (texts: Record<string, string>) => Promise<unknown> | void
  labels: QuestionnaireLabels
  /** Slot under a question's text line, the hook for a voice-fill: `setText` fills the free-text line. */
  renderExtra?: (context: QuestionnaireExtraContext) => ReactNode
  className?: string
}

const TEXT_MAX = 200

/**
 * One question per screen for the unified career + ikigai questionnaire: the question as cards or chips, an optional
 * short text line, Back and Next. Like `StepperWizard`, with the text line and a slot for an input helper.
 */
export function QuestionnaireWizard({ questions, answers, onAnswer, onFinish, labels, renderExtra, className }: Props) {
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [texts, setTexts] = useState<Record<string, string>>({})
  const heading = useRef<HTMLHeadingElement>(null)
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) heading.current?.focus()
    mounted.current = true
  }, [step])

  const question = questions[step]
  if (!question) return null
  const last = step === questions.length - 1
  const stored = question.textKey ? answers[question.textKey] : undefined
  const text = question.textKey ? (texts[question.textKey] ?? (typeof stored === "string" ? stored : "")) : ""
  const value = answers[question.id] as StepValue
  const ready = (canAdvance(question, { [question.id]: value }) || text.trim() !== "") && !busy

  function setText(next: string) {
    if (question?.textKey) setTexts((current) => ({ ...current, [question.textKey!]: next.slice(0, TEXT_MAX) }))
  }
  /** Saves the typed line once, when the question is left (not on every key). */
  function commitText() {
    if (question?.textKey && texts[question.textKey] !== undefined && texts[question.textKey] !== stored)
      onAnswer(question.textKey, texts[question.textKey]!.trim())
  }
  function change(next: StepValue) {
    if (Array.isArray(next) && question?.max && next.length > question.max) next = next.slice(-question.max)
    onAnswer(question!.id, next ?? "")
  }

  async function advance(event?: FormEvent) {
    event?.preventDefault()
    if (!ready) return
    commitText()
    if (!last) return setStep(step + 1)
    setBusy(true)
    setFailed(false)
    try {
      await onFinish({ ...texts, ...(question.textKey ? { [question.textKey]: text.trim() } : {}) })
    } catch {
      setFailed(true)
    }
    setBusy(false)
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
        className="bg-muted h-1.5 overflow-hidden rounded-full"
      >
        <div className="bg-primary h-full transition-[width]" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
      </div>
      <form onSubmit={(event) => void advance(event)} className="flex min-w-0 max-w-2xl flex-col gap-5">
        <header className="flex flex-col gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {question.sectionLabel} · {labels.step(step + 1, questions.length)}
          </p>
          <h2 ref={heading} tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none md:text-2xl">
            {question.title}
          </h2>
          {question.guide ? <p className="text-muted-foreground text-sm">{question.guide}</p> : null}
        </header>
        <QuestionField key={question.id} question={question} value={value ?? ""} onChange={change} disabled={busy} />
        {question.textKey ? (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {question.textLabel}
            <Textarea
              rows={2}
              maxLength={TEXT_MAX}
              value={text}
              placeholder={question.textPlaceholder}
              disabled={busy}
              onChange={(event) => setText(event.target.value)}
              onBlur={commitText}
              className="font-normal"
            />
          </label>
        ) : null}
        {renderExtra?.({ question, text, setText })}
        {failed ? (
          <p role="alert" className="text-destructive text-sm">
            {labels.saveError}
          </p>
        ) : null}
        <div className="bg-background/95 sticky bottom-0 -mx-4 flex items-center justify-between gap-2 border-t px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || busy}
            onClick={() => {
              commitText()
              setStep(step - 1)
            }}
          >
            <Icons.chevronLeft />
            {labels.back}
          </Button>
          <Button type="submit" disabled={!ready}>
            {busy ? labels.saving : last ? labels.finish : labels.next}
            {busy ? null : <Icons.chevronRight />}
          </Button>
        </div>
      </form>
    </section>
  )
}
