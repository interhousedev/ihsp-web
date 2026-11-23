"use client"

import {
  getLmsExamSessionQuery,
  postLmsExamStart,
  type ExamModuleRun,
  type ExamResult,
  type ExamSession,
  type LearningExamBlock,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Markdown, Skeleton } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { refreshProgress } from "../utils/fresh"
import { ExamModuleRunner } from "./exam/exam-module"

/** The exam block: intro, the Bluebook-style module runner, breaks between sections, results and review. */
export function ExamBlock({
  block,
  courseId,
  stepId,
  mode,
  slug,
}: {
  block: LearningExamBlock
  courseId: string
  stepId: string
  mode: "learn" | "preview"
  /** The course address, to refresh the lesson header and sidebar progress after a module submit. */
  slug: string | null
}) {
  const t = useT("examPlayer")
  const client = useQueryClient()
  const query = getLmsExamSessionQuery(stepId, block.id)
  const { data: session, isPending, isError } = useQuery(query)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(false)
  const put = (next: ExamSession) => {
    client.setQueryData(query.queryKey, next)
    if (mode === "learn" && next.status !== "in_module") void refreshProgress(client, { courseId, stepId, slug })
  }
  const totalMinutes = Math.round(
    block.sections
      .flatMap((s) => (s.adaptive ? s.modules.slice(0, 2) : s.modules))
      .reduce((sum, m) => sum + m.time_limit_sec, 0) / 60,
  )

  const start = async () => {
    setStarting(true)
    setError(false)
    try {
      put(await postLmsExamStart(stepId, block.id))
    } catch {
      setError(true)
    } finally {
      setStarting(false)
    }
  }

  const card = (body: React.ReactNode) => (
    <section
      className="flex flex-col gap-3 rounded-lg border p-4"
      data-block-id={block.id}
      aria-label={block.title || t("exam")}
    >
      <h3 className="text-lg font-semibold">{block.title || t("exam")}</h3>
      {body}
    </section>
  )

  if (isPending) return <Skeleton aria-busy="true" className="h-40 w-full rounded-lg" />
  if (isError || !session) return card(<p role="alert">{t("loadFailed")}</p>)

  if (session.status === "in_module" && session.current) {
    return (
      <ExamModuleRunner
        key={session.current.module_id}
        block={block}
        stepId={stepId}
        session={session as ExamSession & { current: ExamModuleRun }}
        onSession={put}
      />
    )
  }
  if (session.status === "finished" && session.result) return card(<Results result={session.result} />)

  if (session.status === "between" && session.next) {
    const next = session.next
    return card(
      session.next_is_new_section ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <h4 className="text-2xl font-semibold">{t("breakTitle")}</h4>
          <p className="text-muted-foreground max-w-md">{t("breakBody", { section: next.section_title })}</p>
          <Button size="lg" disabled={starting} onClick={() => void start()} className="min-h-11">
            {t("resume")}
          </Button>
          {error ? <p role="alert">{t("startFailed")}</p> : null}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p>{t("moduleDone", { done: session.modules_done })}</p>
          <Button size="lg" disabled={starting} onClick={() => void start()} className="min-h-11">
            {t("startModule", { number: next.module_no, minutes: Math.round(next.time_limit_sec / 60) })}
          </Button>
          {error ? <p role="alert">{t("startFailed")}</p> : null}
        </div>
      ),
    )
  }

  return card(
    <>
      <Overview block={block} minutes={totalMinutes} />
      {block.directions ? <Markdown>{block.directions}</Markdown> : null}
      <p className="text-muted-foreground text-sm">{t(mode === "preview" ? "previewNote" : "onceNote")}</p>
      <Button disabled={starting} onClick={() => void start()} className="min-h-11 w-fit">
        {t("begin")}
      </Button>
      {error ? <p role="alert">{t("startFailed")}</p> : null}
    </>,
  )
}

function Overview({ block, minutes }: { block: LearningExamBlock; minutes: number }) {
  const t = useT("examPlayer")
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">{t("overview", { sections: block.sections.length, minutes })}</p>
      <ul className="flex flex-col gap-1 text-sm">
        {block.sections.map((section) => (
          <li key={section.id} className="flex justify-between gap-2 rounded border px-2 py-1">
            <span>{section.title}</span>
            <span className="text-muted-foreground">
              {t("sectionModules", {
                count: section.adaptive ? Math.min(2, section.modules.length) : section.modules.length,
                minutes: Math.round((section.modules[0]?.time_limit_sec ?? 0) / 60),
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Results({ result }: { result: ExamResult }) {
  const t = useT("examPlayer")
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-4 text-center">
        <span className="text-muted-foreground text-sm">{t("totalScore")}</span>
        <strong className="text-4xl">{result.scaled_total ?? `${result.score} / ${result.max_score}`}</strong>
        {result.scaled_total !== null && result.scaled_min !== null && result.scaled_max !== null ? (
          <span className="text-muted-foreground text-xs">
            {t("range", { min: result.scaled_min, max: result.scaled_max })}
          </span>
        ) : null}
      </div>
      <ul className="grid gap-2 md:grid-cols-2">
        {result.sections.map((section) => (
          <li key={section.section_id} className="flex flex-col rounded border p-3">
            <span className="font-medium">{section.title}</span>
            <strong className="text-2xl">{section.scaled_score ?? "—"}</strong>
            <span className="text-muted-foreground text-xs">
              {t("raw", { score: section.score, max: section.max_score })}
            </span>
          </li>
        ))}
      </ul>
      <h4 className="font-semibold">{t("review")}</h4>
      {result.modules.map((module) => (
        <details key={module.module_id} className="rounded border p-3">
          <summary className="cursor-pointer font-medium">
            {module.section_title} · {t("module", { number: module.module_no })} — {module.score} / {module.max_score}
            {module.late ? ` (${t("late")})` : ""}
          </summary>
          <ol className="mt-2 flex flex-col gap-3">
            {module.questions.map((question, i) => {
              const item = module.review.find((r) => r.question_id === question.id)
              const mine = module.answers[question.id]
              const correctIds = (item?.correct_answer?.option_ids as string[] | undefined) ?? []
              return (
                <li key={question.id} className="flex flex-col gap-1 border-t pt-2">
                  <span className={`text-sm font-semibold ${item?.correct ? "text-success" : "text-destructive"}`}>
                    {i + 1}. {item?.correct ? t("correct") : t("incorrect")}
                  </span>
                  <Markdown>{question.prompt}</Markdown>
                  {question.options?.length ? (
                    <ul className="text-sm">
                      {question.options.map((option) => (
                        <li
                          key={option.id}
                          className={
                            correctIds.includes(option.id)
                              ? "text-success font-semibold"
                              : mine?.option_ids?.includes(option.id)
                                ? "text-destructive line-through"
                                : ""
                          }
                        >
                          {option.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">
                      {t("yourAnswer")}: {mine?.number ?? mine?.text ?? "—"}
                      {item?.correct_answer ? ` · ${t("correctAnswer")}: ${formatAnswer(item.correct_answer)}` : ""}
                    </p>
                  )}
                  {item?.explanation ? <p className="text-muted-foreground text-sm">{item.explanation}</p> : null}
                </li>
              )
            })}
          </ol>
        </details>
      ))}
    </div>
  )
}

/** A readable correct answer of a number or text question. */
function formatAnswer(answer: Record<string, unknown>): string {
  const values = Object.values(answer).flatMap((value) => (Array.isArray(value) ? value : [value]))
  return values.filter((value) => typeof value === "string" || typeof value === "number").join(", ") || "—"
}
