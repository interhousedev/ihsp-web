"use client"

import type { StepView } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useMarkViewed } from "../player/hooks/use-mark-viewed"
import { StepContent } from "../player/components/step-content"
import { firstOpenBlock } from "../player/utils/block-nav"
import { CoachPanel, type CoachMessage } from "./coach-panel"
import { closeCoachSession, getLatestCoachSession, openCoachSession, requestCoachHint, sendCoachTurn } from "./coach-api"
import { lessonCtx, lessonHref, pathHref, stepKind, useDuoCourse, useDuoStep, type DuoCourse } from "./use-duo-course"
import "../skin/playful-lesson.css"
import "./duo-coach.css"

/**
 * Opens the lesson named by `?slug=&step=`: the real step comes from the learner API and each of its blocks is shown by
 * the same block player the classic course uses (text, test, flash cards, video, interactive video, H5P, HTML, exam, code,
 * AI review), wrapped in the Duo chrome. The view is keyed by the step id, so a new lesson never shows the old one.
 */
export function DuoLesson() {
  const t = useT("duo")
  const params = useSearchParams()
  const slug = params.get("slug")
  const stepId = params.get("step")
  const { course, isError: courseFailed } = useDuoCourse(slug)
  const { data: step, isError: stepFailed } = useDuoStep(course?.id, stepId)

  if (slug === null || stepId === null || courseFailed || stepFailed) {
    return (
      <div className="p-6">
        <p role="status">{t("lesson.notFound")}</p>
        <Link href={slug ? pathHref(slug) : "/"} className="dc-ghost mt-3 inline-flex">
          {t("lesson.backToPath")}
        </Link>
      </div>
    )
  }
  if (!course || !step) {
    return (
      <p className="p-6" role="status">
        {t("path.loading")}
      </p>
    )
  }
  return <StepLesson key={stepId} stepId={stepId} course={course} step={step} />
}

const sessions = new Map<string, string>()

function StepLesson({ course, step, stepId }: { course: DuoCourse; step: StepView; stepId: string }) {
  const t = useT("duo")
  const router = useRouter()
  const ctx = lessonCtx(course, stepId, step.title)
  const kind = stepKind(step)
  const back = pathHref(course.slug)
  useMarkViewed({ courseId: course.id, stepId, slug: course.slug, step, enabled: true })

  const [block, setBlock] = useState(() => firstOpenBlock(step.blocks))
  const current = step.blocks[block]
  const lastBlock = block >= step.blocks.length - 1
  const nextHref = ctx.nextStepId ? lessonHref(course.slug, ctx.nextStepId) : back

  const flat = course.path.sections.flatMap((section) => section.nodes)
  const position = Math.max(0, flat.findIndex((node) => node.id === stepId))
  const total = flat.length

  const [quitting, setQuitting] = useState(false)
  const [coachOpen, setCoachOpen] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [messages, setMessages] = useState<CoachMessage[]>([])
  const coachable = kind === "test" || step.blocks.some((item) => item.type === "test")

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) setQuitting(true)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Pick up the open conversation of this step (a reload or a return to the lesson).
  useEffect(() => {
    if (!coachable) return
    let alive = true
    getLatestCoachSession(stepId)
      .then(({ session, turns }) => {
        if (!alive || !session || session.closed) return
        sessions.set(stepId, session.id)
        setHintLevel(Math.min(3, session.hint_level))
        setMessages(
          turns.map((turn, index) => ({ id: `r${index}`, from: turn.role === "learner" ? "me" : "coach", text: turn.text })),
        )
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [coachable, stepId])

  const push = (message: CoachMessage) => setMessages((list) => [...list, message])
  const id = () => `m${Date.now()}${Math.random()}`
  const session = async (trigger: "learner_tap" | "wrong_answer") => {
    let open = sessions.get(stepId)
    if (!open) {
      open = (await openCoachSession(stepId, trigger, current?.id)).id
      sessions.set(stepId, open)
    }
    return open
  }
  const hint = () => {
    if (hintLevel >= 3) return
    void (async () => {
      try {
        const reply = await requestCoachHint(await session("learner_tap"))
        setHintLevel(Math.min(3, Math.max(hintLevel + 1, reply.hint_level)))
        push({ id: id(), from: "coach", tag: "hint", text: reply.message })
      } catch {
        push({ id: id(), from: "coach", tag: "answer", text: t("coach.unavailable") })
      }
    })()
  }
  const ask = (text: string) => {
    push({ id: id(), from: "me", text })
    void (async () => {
      try {
        const reply = await sendCoachTurn(await session("learner_tap"), text)
        push({ id: id(), from: "coach", tag: reply.ask_back ? "ask" : "answer", text: reply.message })
      } catch {
        push({ id: id(), from: "coach", tag: "answer", text: t("coach.unavailable") })
      }
    })()
  }
  const leave = () => {
    const open = sessions.get(stepId)
    if (open) {
      sessions.delete(stepId)
      void closeCoachSession(open, "abandoned").catch(() => undefined)
    }
    router.push(back)
  }

  const main = (
    <section className={coachable ? "dc-card" : undefined} data-testid="lesson-body">
      <p className="dc-eyebrow">{t("lesson.where", { number: ctx.sectionNumber, title: ctx.sectionTitle })}</p>
      <h1 className="mb-3 text-lg font-extrabold" data-testid="lesson-title">
        {step.title}
      </h1>
      {current ? (
        <StepContent
          key={current.id}
          block={current}
          courseId={course.id}
          stepId={stepId}
          slug={course.slug}
          preview={step.preview === true}
          focusKey={`${stepId}:${block}`}
        />
      ) : (
        <p className="text-sm">{t("lesson.empty")}</p>
      )}
    </section>
  )

  return (
    <div className="pl-lesson dc-lesson" data-testid={`duo-lesson-${kind}`}>
      {quitting ? (
        <div className="dc-sheet-backdrop" onClick={() => setQuitting(false)}>
          <div
            className="dc-sheet"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dc-quit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="dc-quit-title" className="text-xl font-extrabold">
              {t("lesson.quitTitle")}
            </h2>
            <p className="mt-2 text-sm">{t("lesson.quitDescription")}</p>
            <div className="mt-4 grid gap-2">
              <button type="button" className="pl-btn w-full" autoFocus onClick={() => setQuitting(false)}>
                {t("lesson.stay")}
              </button>
              <button type="button" className="dc-ghost" onClick={leave}>
                {t("lesson.quit")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <header className="pl-topbar">
        <button type="button" className="pl-icon-btn" aria-label={t("lesson.close")} onClick={() => setQuitting(true)}>
          <Icons.close aria-hidden />
        </button>
        <ol
          className="pl-progress"
          role="progressbar"
          aria-label={t("lesson.progress", { number: position + 1, total })}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={position}
        >
          {flat.map((node, index) => (
            <li key={node.id} className="pl-seg" data-state={index < position ? "done" : index === position ? "current" : "todo"}>
              <span />
            </li>
          ))}
        </ol>
        {coachable ? (
          <button type="button" className="dc-ghost" aria-pressed={coachOpen} onClick={() => setCoachOpen((open) => !open)}>
            <Icons.sparkles className="size-5" aria-hidden />
            {t("coach.chip")}
          </button>
        ) : null}
      </header>

      {coachable ? (
        <main className="dc-grid" data-coach={coachOpen ? "" : undefined}>
          {main}
          <div className="dc-coach-wrap" data-open={coachOpen ? "" : undefined}>
            <div className="dc-coach-backdrop" onClick={() => setCoachOpen(false)} aria-hidden />
            <CoachPanel
              question={step.title}
              onClose={() => setCoachOpen(false)}
              hintLevel={hintLevel}
              attempts={current?.type === "test" && current.best != null ? 1 : 0}
              messages={messages}
              onHint={hint}
              onAsk={ask}
            />
          </div>
        </main>
      ) : (
        <main className="dc-kind-main">{main}</main>
      )}

      <footer className="pl-footer" data-coach-open={coachOpen ? "" : undefined}>
        <div className="pl-footer-inner">
          <span className="hidden md:block" />
          {lastBlock ? (
            <Link href={nextHref} prefetch={false} className="pl-btn w-full md:w-auto md:min-w-48" data-testid="lesson-continue">
              {ctx.nextStepId ? t("lesson.continue") : t("lesson.finish")}
            </Link>
          ) : (
            <button type="button" className="pl-btn w-full md:w-auto md:min-w-48" data-testid="lesson-continue" onClick={() => setBlock(block + 1)}>
              {t("lesson.continue")}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
