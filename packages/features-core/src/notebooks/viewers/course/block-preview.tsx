"use client"

import { useT } from "@ihsp/i18n"
import { Markdown, cn } from "@ihsp/ui"
import { IconCards, IconChecklist, IconCheck } from "@ihsp/ui"
import type { DisplayBlock, DisplayQuestion } from "./blocks"

function Question({ question, index }: { question: DisplayQuestion; index: number }) {
  const t = useT("notebooks")
  return (
    <li className="flex flex-col gap-1.5 rounded-md border p-3">
      <div className="text-sm font-medium">
        <span className="text-muted-foreground me-1.5">{index + 1}.</span>
        <Markdown className="inline">{question.prompt}</Markdown>
        <span className="text-muted-foreground ms-2 text-xs font-normal">
          {t(`course.questionType.${question.type}`)}
        </span>
      </div>
      {question.options.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm">
          {question.options.map((option, i) => (
            <li key={i} className={cn("flex items-start gap-2", option.correct && "font-medium")}>
              {option.correct ? (
                <IconCheck aria-hidden className="text-primary mt-0.5 size-4 shrink-0" />
              ) : (
                <span aria-hidden className="size-4 shrink-0" />
              )}
              <span>{option.text}</span>
              {option.correct ? <span className="sr-only">{t("course.correctOption")}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {question.answers.length > 0 ? (
        <p className="text-sm">
          <span className="text-muted-foreground">{t("course.acceptedAnswers")}: </span>
          {question.answers.join(" · ")}
        </p>
      ) : null}
      {question.explanation ? (
        <div className="text-muted-foreground text-sm">
          <Markdown>{question.explanation}</Markdown>
        </div>
      ) : null}
    </li>
  )
}

/** One block of a lesson draft or of a course step, rendered for reading (text with the shared Markdown). */
export function BlockPreview({ block, className }: { block: DisplayBlock; className?: string }) {
  const t = useT("notebooks")
  if (block.type === "text") {
    return (
      <div className={cn("text-sm", className)}>
        <Markdown>{block.markdown}</Markdown>
      </div>
    )
  }
  if (block.type === "flashcards") {
    return (
      <section className={cn("flex flex-col gap-2 rounded-lg border p-3", className)}>
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <IconCards aria-hidden className="size-4" />
          {t("course.cardsBlock", { count: block.cards.length })}
        </h4>
        <ul className="grid gap-2 sm:grid-cols-2">
          {block.cards.map((card, i) => (
            <li key={i} className="bg-muted/40 flex flex-col gap-1 rounded-md p-2 text-sm">
              <Markdown className="font-medium">{card.front}</Markdown>
              <Markdown className="text-muted-foreground">{card.back}</Markdown>
            </li>
          ))}
        </ul>
      </section>
    )
  }
  return (
    <section className={cn("flex flex-col gap-2 rounded-lg border p-3", className)}>
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <IconChecklist aria-hidden className="size-4" />
        {t("course.testBlock", { count: block.questions.length })}
        {block.passingScore !== null ? (
          <span className="text-muted-foreground text-xs font-normal">
            {t("course.passingScore", { percent: block.passingScore })}
          </span>
        ) : null}
      </h4>
      <ol className="flex flex-col gap-2">
        {block.questions.map((question, i) => (
          <Question key={i} question={question} index={i} />
        ))}
      </ol>
    </section>
  )
}

/** All blocks of a draft one after another. */
export function BlockList({ blocks }: { blocks: DisplayBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => (
        <BlockPreview key={i} block={block} />
      ))}
    </div>
  )
}
