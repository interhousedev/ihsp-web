"use client"

import type { Block, Question, TestConfig } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Icons, Markdown } from "@ihsp/ui"
import { secondsToMinutes } from "../utils/time"

function ConfigSummary({ config }: { config: TestConfig }) {
  const t = useT("blocks")
  const minutes = secondsToMinutes(config.time_limit_sec)
  const cooldown = secondsToMinutes(config.cooldown_sec)
  const items = [
    t("config.attempts", { count: config.max_attempts ?? 0 }),
    t("config.passing", { percent: config.passing_score_pct }),
    config.pool_size !== null ? t("config.pool", { count: config.pool_size }) : null,
    minutes !== null ? t("config.timeLimit", { minutes }) : null,
    cooldown !== null ? t("config.cooldown", { minutes: cooldown }) : null,
    config.shuffle_questions ? t("config.shuffleQuestions") : null,
    config.shuffle_options ? t("config.shuffleOptions") : null,
    t("config.showAnswers", { when: t(`showAnswers.${config.show_answers}`) }),
  ].filter((item): item is string => item !== null)
  return (
    <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function QuestionSummary({ question, index }: { question: Question; index: number }) {
  const t = useT("blocks")
  return (
    <li className="rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{index + 1}.</span>
        <Badge variant="outline">{t(`questionTypes.${question.type}`)}</Badge>
        <span className="text-muted-foreground text-xs">{t("points", { count: question.points })}</span>
      </div>
      <Markdown className="mt-1">{question.prompt || t("emptyPrompt")}</Markdown>
      {question.options ? (
        <ul className="mt-2 flex flex-col gap-1">
          {question.options.map((option) => (
            <li key={option.id} className="flex items-start gap-2 text-sm">
              {option.correct ? (
                <Icons.circleCheck className="text-primary mt-0.5 size-4 shrink-0" aria-label={t("correct")} />
              ) : (
                <Icons.circle className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
              )}
              <span className="min-w-0 break-words">{option.text}</span>
              {option.pinned ? <Badge variant="secondary">{t("pinned")}</Badge> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {question.type === "text" && question.answer ? (
        <p className="mt-2 text-sm">
          {t("accepted")}: {(question.answer.accepted ?? []).join(", ") || "-"}
          {question.answer.regex ? ` · ${t("regex")}: ${question.answer.regex}` : ""}
        </p>
      ) : null}
      {question.type === "number" && question.answer ? (
        <p className="mt-2 text-sm">
          {t("numberAnswer", { value: question.answer.value ?? 0, tolerance: question.answer.tolerance ?? 0 })}
        </p>
      ) : null}
      {question.pairs ? (
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {question.pairs.map((pair) => (
            <li key={pair.id}>
              {pair.left} - {pair.right}
            </li>
          ))}
        </ul>
      ) : null}
      {question.table ? (
        <p className="mt-2 text-sm">
          {t("tableSummary", {
            rows: question.table.rows.length,
            columns: question.table.columns.length,
            marked: question.table.correct.flat().filter(Boolean).length,
          })}
        </p>
      ) : null}
      {question.blanks ? (
        <p className="mt-2 text-sm">
          {t("accepted")}: {question.blanks.map((blank) => blank.accepted[0] ?? blank.regex ?? "-").join(" | ")}
        </p>
      ) : null}
      {question.random ? (
        <p className="mt-2 text-sm">
          {t("randomSummary", { formula: question.random.formula, count: question.random.variables.length })}
        </p>
      ) : null}
      {question.formula ? <p className="mt-2 font-mono text-sm">{question.formula.expression}</p> : null}
      {question.explanation ? (
        <p className="text-muted-foreground mt-2 text-xs">
          {t("explanation")}: {question.explanation}
        </p>
      ) : null}
    </li>
  )
}

/** One block as authors see it, with the correct answers marked (editor, diff, conflict dialog). */
export function BlockView({ block }: { block: Block }) {
  const t = useT("blocks")
  if (block.type === "text") {
    return block.markdown.trim() === "" ? (
      <p className="text-muted-foreground text-sm italic">{t("emptyText")}</p>
    ) : (
      <Markdown>{block.markdown}</Markdown>
    )
  }
  if (block.type === "video") {
    return (
      <p className="text-sm break-all">
        {block.url || t("emptyVideo")}
        {block.caption ? ` · ${block.caption}` : ""}
      </p>
    )
  }
  if (block.type === "flashcards") {
    return (
      <ul className="flex flex-col gap-1.5">
        {block.cards.map((card) => (
          <li key={card.id} className="grid gap-1 rounded-md border p-2 text-sm sm:grid-cols-2">
            <span className="break-words">{card.front || "-"}</span>
            <span className="text-muted-foreground break-words">{card.back || "-"}</span>
          </li>
        ))}
        {block.cards.length === 0 ? <li className="text-muted-foreground text-sm">{t("noCards")}</li> : null}
      </ul>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <ConfigSummary config={block.config} />
      <ol className="flex flex-col gap-2">
        {block.questions.map((question, index) => (
          <QuestionSummary key={question.id} question={question} index={index} />
        ))}
      </ol>
    </div>
  )
}
