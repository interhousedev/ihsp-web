"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { useProfileAnswers } from "../hooks/use-profile-answers"
import { isAnswered } from "../lib/visibility"
import { useProfileText } from "../lib/use-profile-text"
import type { Profile, Question } from "../types"
import { SaveBadge } from "./save-badge"

/** The free-text questions of the "goals" section, grouped into the cards of "Your story". */
export const STORY_GROUPS = [
  { id: "proud", questions: ["q20", "q21"] },
  { id: "curious", questions: ["q22"] },
  { id: "self", questions: ["q23"] },
] as const

/** "Your story": cards with a progress bar; each opens a dialog whose answers are saved as they are typed. */
export function StoryCards({ initial, questions }: { initial: Profile; questions: Question[] }) {
  const t = useT("profilePage")
  const text = useProfileText()
  const { answers, state, setAnswer, flush, retry } = useProfileAnswers(initial)
  const [open, setOpen] = useState<string | null>(null)
  const byId = new Map(questions.map((question) => [question.id, question]))
  const groups = STORY_GROUPS.map((group) => ({
    ...group,
    questions: group.questions.filter((id) => byId.has(id)),
  })).filter((group) => group.questions.length > 0)
  const active = groups.find((group) => group.id === open)

  return (
    <>
      <ul className="grid gap-4 md:grid-cols-3">
        {groups.map((group) => {
          const done = group.questions.filter((id) => isAnswered(answers[id])).length
          const percent = Math.round((done / group.questions.length) * 100)
          return (
            <li key={group.id} className="bg-card border-hairline rounded-card flex flex-col gap-4 border p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{t(`story.${group.id}`)}</h3>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t("storyEdit", { title: t(`story.${group.id}`) })}
                  onClick={() => setOpen(group.id)}
                >
                  <Icons.edit aria-hidden />
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <div
                  role="progressbar"
                  aria-label={t(`story.${group.id}`)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  className="bg-muted h-2 overflow-hidden rounded-full"
                >
                  <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-muted-foreground text-sm tabular-nums">
                  {t("storyAnswered", { done, total: group.questions.length })}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      {active ? (
        <ResponsiveDialog
          open
          onOpenChange={(next) => {
            if (!next) {
              void flush()
              setOpen(null)
            }
          }}
          title={t(`story.${active.id}`)}
          onSubmit={(event) => {
            event.preventDefault()
            void flush().then(() => setOpen(null))
          }}
          footer={
            <div className="flex w-full items-center justify-between gap-3">
              <SaveBadge state={state} onRetry={() => void retry()} />
              <Button type="submit">{t("storySave")}</Button>
            </div>
          }
        >
          <div className="flex flex-col gap-6">
            {active.questions.map((id, index) => {
              const max = byId.get(id)?.max_length ?? 300
              const value = typeof answers[id] === "string" ? (answers[id] as string) : ""
              return (
                <div key={id} className="flex flex-col gap-2">
                  <label htmlFor={`story-${id}`} className="text-sm font-medium">
                    {index + 1}. {text.label(id)}
                  </label>
                  <Textarea
                    id={`story-${id}`}
                    rows={5}
                    maxLength={max}
                    value={value}
                    onChange={(event) => setAnswer(id, event.target.value)}
                  />
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {t("storyLimit", { used: value.length, max })}
                  </p>
                </div>
              )
            })}
          </div>
        </ResponsiveDialog>
      ) : null}
    </>
  )
}
