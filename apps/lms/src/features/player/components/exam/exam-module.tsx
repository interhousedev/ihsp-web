"use client"

import {
  isApiError,
  postLmsExamSubmit,
  putLmsExamAnswers,
  type Answer,
  type ExamModuleRun,
  type ExamSession,
  type LearningExamBlock,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, Markdown, Textarea } from "@ihsp/ui"
import { useCallback, useEffect, useRef, useState } from "react"
import { isAnswered } from "../../utils/answers"
import { formatClock } from "../../utils/exam-math"
import { ExamCalculatorPanel } from "./calculator"
import { useEscapeKey } from "./use-escape-key"

const SAVE_DEBOUNCE_MS = 800
const WARNING_SEC = 5 * 60
const LETTERS = "ABCDEFGH"
const HIGHLIGHT = "exam-highlight"

type Note = { id: number; text: string; quote: string }
/** A highlight as character offsets into the prompt text, so it survives a reload. */
type Mark = { start: number; end: number }

function loadAnnotations(key: string): { notes: Record<string, Note[]>; marks: Record<string, Mark[]> } {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(key)
    const parsed = raw ? (JSON.parse(raw) as { notes?: Record<string, Note[]>; marks?: Record<string, Mark[]> }) : {}
    return { notes: parsed.notes ?? {}, marks: parsed.marks ?? {} }
  } catch {
    return { notes: {}, marks: {} }
  }
}

function offsetOf(root: Node, node: Node, offset: number): number {
  const range = document.createRange()
  range.selectNodeContents(root)
  range.setEnd(node, offset)
  return range.toString().length
}

function toMark(root: Node, range: Range): Mark {
  return {
    start: offsetOf(root, range.startContainer, range.startOffset),
    end: offsetOf(root, range.endContainer, range.endOffset),
  }
}

function toRange(root: Node, mark: Mark): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let seen = 0
  let started = false
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0
    if (!started && mark.start <= seen + length) {
      range.setStart(node, mark.start - seen)
      started = true
    }
    if (started && mark.end <= seen + length) {
      range.setEnd(node, mark.end - seen)
      return range
    }
    seen += length
  }
  return null
}

/** The full-screen Bluebook-style runner of one open module. */
export function ExamModuleRunner({
  block,
  stepId,
  session,
  onSession,
}: {
  block: LearningExamBlock
  stepId: string
  session: ExamSession & { current: ExamModuleRun }
  onSession: (session: ExamSession) => void
}) {
  const t = useT("examPlayer")
  const run = session.current
  const questions = run.questions
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>(run.answers)
  const [marked, setMarked] = useState<Set<string>>(new Set())
  const [struck, setStruck] = useState<Record<string, string[]>>({})
  const [eliminating, setEliminating] = useState(false)
  const [checking, setChecking] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  useEscapeKey(() => setNavOpen(false), navOpen)
  const [panel, setPanel] = useState<"directions" | "reference" | "calculator" | null>(null)
  const [timerHidden, setTimerHidden] = useState(false)
  const [lineReader, setLineReader] = useState(false)
  const [readerY, setReaderY] = useState(240)
  const [zoom, setZoom] = useState(1)
  // annotations live in localStorage per sitting module (started_at identifies the run)
  const storeKey = `ihsp-exam:${stepId}:${block.id}:${run.module_id}:${run.started_at}`
  const [notes, setNotes] = useState<Record<string, Note[]>>(() => loadAnnotations(storeKey).notes)
  const [draft, setDraft] = useState<{ quote: string; text: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const promptRef = useRef<HTMLDivElement>(null)
  const marks = useRef<Record<string, Mark[]>>(loadAnnotations(storeKey).marks)
  useEffect(() => {
    try {
      localStorage.setItem(storeKey, JSON.stringify({ notes, marks: marks.current }))
    } catch {
      // storage full or blocked: annotations stay for this page only
    }
  }, [notes, storeKey])

  // server clock: remaining = deadline - (now + offset)
  const [offset] = useState(() => Date.parse(session.server_now) - Date.now())
  const deadline = Date.parse(run.deadline_at)
  const [now, setNow] = useState(() => Date.now() + offset)
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now() + offset), 1000)
    return () => window.clearInterval(id)
  }, [offset])
  const remaining = Math.max(0, (deadline - now) / 1000)
  const warning = remaining <= WARNING_SEC

  // saves go one at a time: a debounce collects changes, one request is in flight at most
  const pending = useRef<Record<string, Answer>>({})
  const inFlight = useRef<Promise<void> | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const flush = useCallback(async (): Promise<void> => {
    if (inFlight.current) await inFlight.current
    const batch = pending.current
    if (Object.keys(batch).length === 0) return
    pending.current = {}
    inFlight.current = putLmsExamAnswers(stepId, block.id, run.module_id, batch)
      .then(() => setError(null))
      .catch((caught: unknown) => {
        if (isApiError(caught) && caught.type === "lms/exam-module-closed") setError(t("closed"))
        else {
          pending.current = { ...batch, ...pending.current }
          setError(t("saveFailed"))
        }
      })
      .finally(() => {
        inFlight.current = null
      })
    await inFlight.current
  }, [block.id, run.module_id, stepId, t])

  const setAnswer = (questionId: string, answer: Answer | null) => {
    const value = answer ?? {}
    setAnswers((items) => ({ ...items, [questionId]: value }))
    pending.current = { ...pending.current, [questionId]: value }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void flush(), SAVE_DEBOUNCE_MS)
  }

  const submit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    window.clearTimeout(timer.current)
    await flush()
    try {
      onSession(await postLmsExamSubmit(stepId, block.id, run.module_id))
    } catch {
      setError(t("submitFailed"))
      setSubmitting(false)
    }
  }, [block.id, flush, onSession, run.module_id, stepId, submitting, t])

  useEffect(() => {
    if (remaining <= 0) void submit()
  }, [remaining, submit])

  // highlights: the CSS Custom Highlight API paints ranges without touching React's DOM
  const question = questions[index]
  useEffect(() => {
    const registry = typeof CSS !== "undefined" && "highlights" in CSS ? CSS.highlights : null
    const root = promptRef.current
    if (!registry || !question || !root) return
    const ranges = (marks.current[question.id] ?? []).flatMap((mark) => toRange(root, mark) ?? [])
    registry.set(HIGHLIGHT, new Highlight(...ranges))
    return () => void registry.delete(HIGHLIGHT)
  }, [question, notes])

  const annotate = () => {
    const selection = window.getSelection()
    if (!question || !selection || selection.isCollapsed || !promptRef.current) return
    const range = selection.getRangeAt(0)
    if (!promptRef.current.contains(range.commonAncestorContainer)) return
    marks.current[question.id] = [...(marks.current[question.id] ?? []), toMark(promptRef.current, range)]
    setDraft({ quote: selection.toString().slice(0, 200), text: "" })
    selection.removeAllRanges()
  }

  const go = (next: number) => {
    setChecking(false)
    setNavOpen(false)
    setIndex(Math.max(0, Math.min(questions.length - 1, next)))
  }

  useEffect(() => {
    if (!lineReader) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "ArrowDown" && event.altKey) setReaderY((y) => y + 24)
      if (event.key === "ArrowUp" && event.altKey) setReaderY((y) => Math.max(80, y - 24))
    }
    const onMouseMove = (event: MouseEvent) => setReaderY(event.clientY)
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("mousemove", onMouseMove)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("mousemove", onMouseMove)
    }
  }, [lineReader])

  const title = `${t("section", { number: run.section_no })}, ${t("module", { number: run.module_no })}: ${run.section_title}`
  const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length

  return (
    <div
      className="bg-background fixed inset-0 z-50 flex flex-col"
      role="application"
      aria-label={title}
      data-exam-module
    >
      {/* top bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-sm font-semibold md:text-base">{title}</h1>
          <Button
            variant="link"
            size="sm"
            className="h-auto w-fit p-0"
            aria-expanded={panel === "directions"}
            onClick={() => setPanel(panel === "directions" ? null : "directions")}
          >
            {t("directions")} <Icons.chevronDown aria-hidden />
          </Button>
        </div>
        <div className="flex flex-col items-center" aria-live={warning ? "assertive" : "off"}>
          {timerHidden && !warning ? (
            <Icons.clock aria-label={t("timerHidden")} />
          ) : (
            <span role="timer" className={`font-mono text-lg font-bold ${warning ? "text-destructive" : ""}`}>
              {formatClock(remaining)}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-6 rounded-full px-2 text-xs"
            onClick={() => setTimerHidden(!timerHidden)}
          >
            {timerHidden ? t("show") : t("hide")}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label={t("tools")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={annotate}
            title={t("annotateHint")}
            aria-label={t("annotate")}
            className="min-h-11 md:min-h-9"
          >
            <Icons.edit aria-hidden />
            <span className="hidden md:inline">{t("annotate")}</span>
          </Button>
          {block.calculator !== "none" ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={t("calculator")}
              className="min-h-11 md:min-h-9"
              aria-pressed={panel === "calculator"}
              onClick={() => setPanel(panel === "calculator" ? null : "calculator")}
            >
              <Icons.grades aria-hidden />
              <span className="hidden md:inline">{t("calculator")}</span>
            </Button>
          ) : null}
          {block.reference_sheet ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={t("reference")}
              className="min-h-11 md:min-h-9"
              aria-pressed={panel === "reference"}
              onClick={() => setPanel(panel === "reference" ? null : "reference")}
            >
              <Icons.post aria-hidden />
              <span className="hidden md:inline">{t("reference")}</span>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("lineReader")}
            className="min-h-11 md:min-h-9"
            aria-pressed={lineReader}
            onClick={() => setLineReader(!lineReader)}
          >
            <Icons.eye aria-hidden />
            <span className="hidden md:inline">{t("lineReader")}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("zoomOut")}
            onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))}
          >
            A−
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("zoomIn")}
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
          >
            A+
          </Button>
        </div>
      </header>
      {warning && remaining > 0 ? (
        <p role="alert" className="bg-destructive/10 text-destructive px-3 py-1 text-center text-sm">
          {t("fiveMinutes")}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="bg-warning-muted text-warning px-3 py-1 text-center text-sm">
          {error}
        </p>
      ) : null}

      {panel === "directions" ? (
        <Overlay title={t("directions")} onClose={() => setPanel(null)}>
          <Markdown>{block.directions || t("noDirections")}</Markdown>
        </Overlay>
      ) : null}
      {panel === "reference" ? (
        <Overlay title={t("reference")} onClose={() => setPanel(null)}>
          <Markdown>{block.reference_sheet}</Markdown>
        </Overlay>
      ) : null}
      {panel === "calculator" ? <ExamCalculatorPanel kind={block.calculator} onClose={() => setPanel(null)} /> : null}

      {/* body */}
      <main className="flex-1 overflow-auto" style={{ fontSize: `${zoom}rem` }}>
        {checking ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 text-center">
            <h2 className="text-2xl font-semibold">{t("checkTitle")}</h2>
            <p className="text-muted-foreground">{t("checkBody")}</p>
            <QuestionGrid questions={questions} answers={answers} marked={marked} current={-1} onPick={go} />
          </div>
        ) : question ? (
          <div className="mx-auto grid max-w-6xl gap-4 p-3 md:p-6">
            <div className="bg-muted flex items-center justify-between gap-2 rounded px-2 py-1">
              <span className="bg-foreground text-background rounded px-2 font-bold">{index + 1}</span>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm md:min-h-8">
                <input
                  type="checkbox"
                  className="size-5"
                  checked={marked.has(question.id)}
                  onChange={() =>
                    setMarked((items) => {
                      const next = new Set(items)
                      if (next.has(question.id)) next.delete(question.id)
                      else next.add(question.id)
                      return next
                    })
                  }
                />
                <Icons.flag aria-hidden className={marked.has(question.id) ? "text-destructive" : ""} />
                {t("markForReview")}
              </label>
              {question.options?.length ? (
                <Button
                  variant={eliminating ? "default" : "outline"}
                  size="sm"
                  aria-pressed={eliminating}
                  onClick={() => setEliminating(!eliminating)}
                  title={t("eliminator")}
                >
                  <s>ABC</s>
                </Button>
              ) : null}
            </div>
            <div ref={promptRef} className="exam-prompt">
              <Markdown>{question.prompt}</Markdown>
            </div>
            {draft ? (
              <div className="border-warning bg-warning-muted flex flex-col gap-2 rounded border p-2">
                <q className="text-sm italic">{draft.quote}</q>
                <Textarea
                  aria-label={t("note")}
                  value={draft.text}
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setNotes((items) => ({
                        ...items,
                        [question.id]: [...(items[question.id] ?? []), { id: Date.now(), ...draft }],
                      }))
                      setDraft(null)
                    }}
                  >
                    {t("saveNote")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : null}
            {(notes[question.id] ?? []).map((note) => (
              <p key={note.id} className="bg-warning-muted rounded p-2 text-sm">
                <q className="italic">{note.quote}</q> {note.text}
              </p>
            ))}
            <AnswerInput
              questionId={question.id}
              type={question.type}
              options={question.options ?? []}
              answer={answers[question.id]}
              struck={struck[question.id] ?? []}
              eliminating={eliminating}
              onStrike={(optionId) =>
                setStruck((items) => {
                  const list = items[question.id] ?? []
                  return {
                    ...items,
                    [question.id]: list.includes(optionId) ? list.filter((id) => id !== optionId) : [...list, optionId],
                  }
                })
              }
              onChange={(answer) => setAnswer(question.id, answer)}
            />
          </div>
        ) : null}
      </main>

      {lineReader ? (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[55]">
          <div className="absolute inset-x-0 top-0 bg-black/60" style={{ height: Math.max(0, readerY - 30) }} />
          <div className="absolute inset-x-0 bottom-0 bg-black/60" style={{ top: readerY + 30 }} />
        </div>
      ) : null}

      {/* bottom bar */}
      <footer className="relative flex items-center justify-between gap-2 border-t border-dashed px-3 py-2">
        <span className="hidden text-sm font-medium md:inline">
          {t("answered", { count: answeredCount, total: questions.length })}
        </span>
        <Button
          variant="default"
          size="sm"
          className="bg-foreground text-background min-h-11 min-w-0 shrink md:min-h-9"
          aria-expanded={navOpen}
          onClick={() => setNavOpen(!navOpen)}
        >
          <span className="truncate">
            {checking ? t("checkShort") : t("questionOf", { number: index + 1, total: questions.length })}
          </span>
          <Icons.chevronUp aria-hidden />
        </Button>
        {navOpen ? (
          <div
            role="dialog"
            aria-label={t("navigator")}
            className="bg-background absolute bottom-full left-1/2 z-[58] mb-2 w-[min(28rem,calc(100vw-1rem))] -translate-x-1/2 rounded-lg border p-3 shadow-xl"
          >
            <QuestionGrid
              questions={questions}
              answers={answers}
              marked={marked}
              current={checking ? -1 : index}
              onPick={go}
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                setChecking(true)
                setNavOpen(false)
              }}
            >
              {t("goToCheck")}
            </Button>
          </div>
        ) : null}
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            disabled={!checking && index === 0}
            className="min-h-11 md:min-h-9"
            onClick={() => (checking ? go(questions.length - 1) : go(index - 1))}
          >
            {t("back")}
          </Button>
          {checking ? (
            <Button className="min-h-11 md:min-h-9" disabled={submitting} onClick={() => void submit()}>
              {t("submitModule")}
            </Button>
          ) : (
            <Button
              className="min-h-11 md:min-h-9"
              onClick={() => (index === questions.length - 1 ? setChecking(true) : go(index + 1))}
            >
              {t("next")}
            </Button>
          )}
        </div>
      </footer>
      <style>{`::highlight(${HIGHLIGHT}) { background-color: var(--warning-muted); }`}</style>
    </div>
  )
}

function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useT("examPlayer")
  useEscapeKey(onClose)
  return (
    <section
      role="dialog"
      aria-label={title}
      className="bg-background absolute left-2 right-2 top-16 z-[60] mx-auto max-h-[70vh] max-w-2xl overflow-auto rounded-lg border p-4 shadow-xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={t("close")}
          autoFocus
          className="size-11 md:size-8"
        >
          <Icons.close aria-hidden />
        </Button>
      </div>
      {children}
    </section>
  )
}

function QuestionGrid({
  questions,
  answers,
  marked,
  current,
  onPick,
}: {
  questions: { id: string }[]
  answers: Record<string, Answer>
  marked: Set<string>
  current: number
  onPick: (index: number) => void
}) {
  const t = useT("examPlayer")
  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground flex flex-wrap justify-center gap-3 text-xs">
        <span>⌖ {t("legendCurrent")}</span>
        <span>▢ {t("legendUnanswered")}</span>
        <span>⚑ {t("legendMarked")}</span>
      </div>
      <ol className="mx-auto flex max-w-[17.5rem] flex-wrap justify-center gap-2 md:max-w-[29.5rem]">
        {questions.map((q, i) => {
          const done = isAnswered(answers[q.id])
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onPick(i)}
                aria-current={i === current ? "step" : undefined}
                aria-label={`${t("questionOf", { number: i + 1, total: questions.length })}${done ? "" : `, ${t("legendUnanswered")}`}${marked.has(q.id) ? `, ${t("legendMarked")}` : ""}`}
                className={`relative flex size-10 items-center justify-center rounded text-sm font-semibold ${done ? "bg-primary text-primary-foreground" : "border border-dashed"} ${i === current ? "ring-foreground ring-2 ring-offset-1" : ""}`}
              >
                {i + 1}
                {marked.has(q.id) ? (
                  <span aria-hidden className="text-destructive absolute -right-1 -top-2">
                    ⚑
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function AnswerInput({
  questionId,
  type,
  options,
  answer,
  struck,
  eliminating,
  onStrike,
  onChange,
}: {
  questionId: string
  type: string
  options: { id: string; text: string }[]
  answer: Answer | undefined
  struck: string[]
  eliminating: boolean
  onStrike: (optionId: string) => void
  onChange: (answer: Answer | null) => void
}) {
  const t = useT("examPlayer")
  const selected = answer?.option_ids ?? []
  if (type === "single" || type === "multiple") {
    const multiple = type === "multiple"
    return (
      <div role={multiple ? "group" : "radiogroup"} aria-label={t("choices")} className="flex flex-col gap-2">
        {options.map((option, i) => {
          const checked = selected.includes(option.id)
          const out = struck.includes(option.id)
          return (
            <div key={option.id} className="flex items-center gap-2">
              <label
                className={`has-[:checked]:border-primary has-[:checked]:ring-primary flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2 has-[:checked]:ring-1 ${out ? "opacity-50" : ""}`}
              >
                <input
                  type={multiple ? "checkbox" : "radio"}
                  name={questionId}
                  className="sr-only"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      option_ids: multiple
                        ? checked
                          ? selected.filter((id) => id !== option.id)
                          : [...selected, option.id]
                        : [option.id],
                    })
                  }
                />
                <span
                  aria-hidden
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${checked ? "bg-primary text-primary-foreground border-primary" : ""}`}
                >
                  {LETTERS[i]}
                </span>
                <span className={`min-w-0 break-words ${out ? "line-through" : ""}`}>{option.text}</span>
              </label>
              {eliminating ? (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-pressed={out}
                  aria-label={t(out ? "undoEliminate" : "eliminate", { letter: LETTERS[i] ?? "" })}
                  onClick={() => onStrike(option.id)}
                  className="min-h-11"
                >
                  {out ? t("undo") : <s>{LETTERS[i]}</s>}
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    )
  }
  if (type === "number") {
    return <StudentResponse answer={answer} onChange={onChange} />
  }
  if (type === "free") {
    return (
      <Textarea
        aria-label={t("yourAnswer")}
        rows={8}
        value={answer?.text ?? ""}
        onChange={(e) => onChange({ text: e.target.value })}
      />
    )
  }
  return (
    <Input
      aria-label={t("yourAnswer")}
      value={answer?.text ?? ""}
      onChange={(e) => onChange({ text: e.target.value })}
      className="h-11"
      autoComplete="off"
    />
  )
}

/** The SAT student-produced response: up to 5 characters (6 with a minus), fractions allowed, with a preview. */
function StudentResponse({
  answer,
  onChange,
}: {
  answer: Answer | undefined
  onChange: (answer: Answer | null) => void
}) {
  const t = useT("examPlayer")
  const [raw, setRaw] = useState(answer?.number !== undefined ? String(answer.number) : "")
  const parse = (text: string): number | null => {
    const fraction = /^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(text)
    if (fraction) return Number(fraction[2]) === 0 ? null : Number(fraction[1]) / Number(fraction[2])
    return /^-?(\d+\.?\d*|\.\d+)$/.test(text) ? Number(text) : null
  }
  const value = parse(raw)
  return (
    <div className="flex max-w-xs flex-col gap-2">
      <Input
        aria-label={t("yourAnswer")}
        inputMode="decimal"
        maxLength={raw.startsWith("-") ? 6 : 5}
        value={raw}
        onChange={(e) => {
          const text = e.target.value.replace(/[^0-9./-]/g, "")
          setRaw(text)
          const parsed = parse(text)
          onChange(parsed === null ? null : { number: parsed })
        }}
        className="h-12 border-2 text-center font-mono text-lg"
      />
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {t("answerPreview")}: <strong className="text-foreground font-mono">{value === null ? "—" : raw}</strong>
      </p>
    </div>
  )
}
