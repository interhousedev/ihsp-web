"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, Pill, Skeleton } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useAddIdea, type Idea } from "../api"
import { IdeaCard } from "../components/ideas-board"
import type { IdeaFit, PromptGroup } from "./api"
import { groupLabel } from "./group-label"

const SHOWN = 3

/** The prompts one idea answers best, with a score; each can start a draft for its whole prompt group. */
function FitList({
  fit,
  pending,
  groupOf,
  onDraft,
}: {
  fit: IdeaFit | undefined
  pending: boolean
  groupOf: (promptKey: string) => PromptGroup | undefined
  onDraft: (group: PromptGroup) => void
}) {
  const t = useT("essayFlow")
  if (pending) return <Skeleton className="h-10 w-full" />
  if (!fit?.items.length) return <p className="text-muted-foreground text-xs">{t("ideas.fitNone")}</p>
  const top = [...fit.items].sort((a, b) => b.score - a.score).slice(0, SHOWN)
  return (
    <div className="flex flex-col gap-1.5" data-testid="idea-fit">
      <p className="text-muted-foreground text-xs font-medium">{t("ideas.fitTitle")}</p>
      <ul className="flex flex-col gap-1.5">
        {top.map(({ prompt, score }) => {
          const group = groupOf(prompt.key)
          return (
            <li key={prompt.key} className="flex min-w-0 flex-col gap-1 text-xs sm:flex-row sm:items-center sm:gap-2">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <Pill tone={score >= 60 ? "success" : score >= 40 ? "warning" : "neutral"}>{score}</Pill>
                <span className="min-w-0 truncate" title={prompt.prompt}>
                  <span className="font-medium">{group ? groupLabel(group) : prompt.institution_name}</span>
                  {" · "}
                  {prompt.prompt}
                </span>
              </span>
              {group ? (
                <Button type="button" size="sm" variant="ghost" className="self-start" onClick={() => onDraft(group)}>
                  <Icons.post aria-hidden />
                  {t("ideas.draftFromFit")}
                </Button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** The ideas of the student, newest first, each scored against the prompts still open. */
export function IdeaBank({
  ideas,
  fits,
  aiGranted,
  groupOf,
  onDraft,
}: {
  ideas: Idea[]
  fits: Record<string, { data: IdeaFit | undefined; pending: boolean }>
  aiGranted: boolean
  groupOf: (promptKey: string) => PromptGroup | undefined
  onDraft: (group: PromptGroup, idea: string) => void
}) {
  const t = useT("essayFlow")
  const errorMessage = useErrorMessage()
  const add = useAddIdea()
  const [body, setBody] = useState("")
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = body.trim()
    if (!text) return
    add.mutate(
      { body: text, tags: [], essay_id: null },
      { onSuccess: () => setBody(""), onError: (error) => toast.error(errorMessage(error)) },
    )
  }
  return (
    <section className="flex min-w-0 flex-col gap-3" aria-labelledby="idea-bank">
      <h3 id="idea-bank" className="text-base font-semibold">
        {t("ideas.bankTitle")}
      </h3>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Label htmlFor="flow-idea-body">{t("ideas.bodyLabel")}</Label>
          <Input id="flow-idea-body" value={body} maxLength={1000} onChange={(e) => setBody(e.target.value)} />
        </div>
        <Button type="submit" disabled={add.isPending || !body.trim()}>
          {t("ideas.add")}
        </Button>
      </form>
      {!aiGranted ? <p className="text-muted-foreground text-xs">{t("ideas.fitConsent")}</p> : null}
      {ideas.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("ideas.empty")}</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea}>
              {aiGranted ? (
                <FitList
                  fit={fits[idea.body]?.data}
                  pending={fits[idea.body]?.pending ?? false}
                  groupOf={groupOf}
                  onDraft={(group) => onDraft(group, idea.body)}
                />
              ) : null}
            </IdeaCard>
          ))}
        </ul>
      )}
    </section>
  )
}
