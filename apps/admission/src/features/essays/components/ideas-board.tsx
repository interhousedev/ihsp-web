"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button, Icons, Input, Label, Skeleton, StateView } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import {
  IDEA_STATUSES,
  useAddIdea,
  useDeleteIdea,
  useExpandIdea,
  useIdeas,
  usePatchIdea,
  type CoachExpansion,
  type Idea,
} from "../api"
import { CoachError } from "./coach-error"

function IdeaCard({ idea }: { idea: Idea }) {
  const t = useT("essays")
  const errorMessage = useErrorMessage()
  const patch = usePatchIdea()
  const remove = useDeleteIdea()
  const expand = useExpandIdea()
  const [expansion, setExpansion] = useState<CoachExpansion | null>(null)
  const fail = (error: unknown) => toast.error(errorMessage(error))
  return (
    <li className="border-hairline flex flex-col gap-2 rounded-card border p-3 animate-in fade-in">
      <p className="text-sm whitespace-pre-wrap">{idea.body}</p>
      {idea.tags.length ? (
        <div className="flex flex-wrap gap-1">
          {idea.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t("ideas.statusLabel")}>
        {IDEA_STATUSES.map((s) => (
          <Button
            key={s}
            type="button"
            size="sm"
            variant={idea.status === s ? "default" : "ghost"}
            aria-pressed={idea.status === s}
            onClick={() =>
              idea.status === s ||
              patch.mutate({ id: idea.id, lock_version: idea.lock_version, status: s }, { onError: fail })
            }
          >
            {t(`ideas.status.${s}`)}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={expand.isPending}
          onClick={() => expand.mutate(idea.id, { onSuccess: setExpansion })}
        >
          <Icons.sparkles aria-hidden />
          {t("ideas.expand")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={t("ideas.delete")}
          onClick={() => remove.mutate(idea.id, { onError: fail })}
        >
          <Icons.trash aria-hidden />
        </Button>
      </div>
      <CoachError error={expand.error} />
      {expansion ? (
        <div className="bg-muted/40 flex flex-col gap-1 rounded-md p-2 text-sm animate-in fade-in">
          <p>{expansion.fit}</p>
          <ul className="list-disc pl-5">
            {expansion.angles.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  )
}

/** Story ideas with tags; the student keeps, explores or drops each one. */
export function IdeasBoard({ essayId }: { essayId?: string }) {
  const t = useT("essays")
  const errorMessage = useErrorMessage()
  const query = useIdeas()
  const add = useAddIdea()
  const [body, setBody] = useState("")
  const [tags, setTags] = useState("")
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!body.trim()) return
    const tagList = [
      ...new Set(
        tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ]
    add.mutate(
      { body: body.trim(), tags: tagList, essay_id: essayId ?? null },
      {
        onSuccess: () => {
          setBody("")
          setTags("")
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }
  const ideas = (query.data?.items ?? []).filter((i) => !essayId || !i.essay_id || i.essay_id === essayId)
  return (
    <section className="flex flex-col gap-3" aria-labelledby="ideas-title">
      <h2 id="ideas-title" className="text-lg font-semibold">
        {t("ideas.title")}
      </h2>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1">
          <Label htmlFor="idea-body">{t("ideas.body")}</Label>
          <Input id="idea-body" value={body} maxLength={1000} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1 sm:w-48">
          <Label htmlFor="idea-tags">{t("ideas.tags")}</Label>
          <Input id="idea-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <Button type="submit" disabled={add.isPending || !body.trim()}>
          {t("ideas.add")}
        </Button>
      </form>
      {query.isPending ? (
        <Skeleton className="h-20 w-full" />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : ideas.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("ideas.empty")}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {IDEA_STATUSES.map((s) => (
            <div key={s} className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-sm font-medium">{t(`ideas.status.${s}`)}</h3>
              <ul className="flex flex-col gap-2">
                {ideas
                  .filter((i) => i.status === s)
                  .map((i) => (
                    <IdeaCard key={i.id} idea={i} />
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
