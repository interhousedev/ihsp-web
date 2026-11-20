"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, buttonVariants, Icons, Input, Label, Pill, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from "@ihsp/ui"
import Link from "next/link"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useCreateEssay, useEssay, useEssays, type EssaySummary } from "../api"
import { CoachError } from "../components/coach-error"
import { useEssayLabel } from "../components/supp-label"
import { useForkEssay, useGroupCritique, type PromptGroup } from "./api"
import { groupLabel, groupWordLimit } from "./group-label"

const MAX_TARGETS = 5

/** A draft written for a prompt group: one critique per university, and a fork to split one away. */
function GroupTools({ essayId }: { essayId: string }) {
  const t = useT("essayFlow")
  const errorMessage = useErrorMessage()
  const essay = useEssay(essayId)
  const critique = useGroupCritique(essayId)
  const fork = useForkEssay(essayId)
  const targets = essay.data?.targets ?? []
  if (targets.length === 0) return null
  const run = (refresh: boolean) => critique.mutate(refresh, { onError: () => undefined })
  return (
    <div className="flex flex-col gap-3 border-t pt-3">
      <ul className="flex flex-wrap gap-2" aria-label={t("drafts.targets")}>
        {targets.map((tg) => (
          <li key={`${tg.institution_id ?? "common"}-${tg.position}`} className="max-w-full">
            <span className="bg-muted flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs">
              <span className="min-w-0 truncate" title={tg.prompt}>
                {tg.prompt}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={critique.isPending} onClick={() => run(false)}>
          <Icons.sparkles aria-hidden />
          {critique.isPending ? t("drafts.critiquing") : t("drafts.critique", { count: targets.length })}
        </Button>
        {critique.data ? (
          <Button type="button" size="sm" variant="ghost" disabled={critique.isPending} onClick={() => run(true)}>
            {t("drafts.refresh")}
          </Button>
        ) : null}
      </div>
      <CoachError error={critique.error} />
      {critique.data ? (
        <ul className="flex flex-col gap-3" data-testid="group-critique">
          {critique.data.universities.map((u) => {
            const target = targets.find((tg) => tg.institution_id === u.institution_id)
            return (
              <li key={u.institution_id} className="bg-muted/30 rounded-card flex min-w-0 flex-col gap-2 border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{u.name}</span>
                  <Pill tone={u.review.alignment >= 70 ? "success" : u.review.alignment >= 40 ? "warning" : "danger"}>
                    {t("drafts.alignment", { score: u.review.alignment })}
                  </Pill>
                </div>
                <p>{u.review.fit_summary}</p>
                {u.review.risks.length ? (
                  <ul className="text-muted-foreground list-disc pl-5">
                    {u.review.risks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : null}
                {targets.length > 1 && target ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="self-start"
                    disabled={fork.isPending}
                    onClick={() =>
                      fork.mutate(
                        { institution_id: target.institution_id, position: target.position },
                        {
                          onSuccess: () => toast.success(t("drafts.forked", { name: u.name })),
                          onError: (error) => toast.error(errorMessage(error)),
                        },
                      )
                    }
                  >
                    <Icons.route aria-hidden />
                    {t("drafts.fork", { name: u.name })}
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

const optionLabel = (g: Parameters<typeof groupLabel>[0]) =>
  `${g.covered ? "✓ " : ""}${groupLabel(g)} — ${g.prompts[0]?.prompt.slice(0, 70) ?? ""}`

function DraftCard({ essay }: { essay: EssaySummary }) {
  const t = useT("essayFlow")
  const { label } = useEssayLabel()
  const full = useEssay(essay.id)
  return (
    <li className="bg-card rounded-card flex min-w-0 flex-col gap-3 border p-3" data-testid="essay-draft">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 truncate font-medium">{label(essay)}</span>
        <span className="flex flex-wrap items-center gap-1.5">
          {full.data?.forked_from ? <Pill tone="neutral">{t("drafts.forkedPill")}</Pill> : null}
          <Pill tone={essay.status === "final" ? "success" : "warning"}>
            {t(essay.status === "final" ? "drafts.final" : "drafts.draft")}
          </Pill>
        </span>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          {essay.word_limit
            ? t("drafts.wordsOf", { count: essay.word_count, limit: essay.word_limit })
            : t("drafts.words", { count: essay.word_count })}
        </span>
        <Link
          href={`/essays/edit/?id=${encodeURIComponent(essay.id)}`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          {t("drafts.open")}
        </Link>
      </div>
      <GroupTools essayId={essay.id} />
    </li>
  )
}

/** Start a draft for a whole prompt group; the form is seeded from a fit row when one was clicked. */
export function NewDraft({
  groups,
  seed,
  onDone,
}: {
  groups: PromptGroup[]
  seed: { key: string; title: string } | null
  onDone: () => void
}) {
  const t = useT("essayFlow")
  const errorMessage = useErrorMessage()
  const create = useCreateEssay()
  const [key, setKey] = useState(seed?.key ?? groups.find((g) => !g.covered)?.key ?? groups[0]?.key ?? "")
  const [title, setTitle] = useState(seed?.title ?? "")
  const group = groups.find((g) => g.key === key)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!group) return
    const prompts = group.prompts.slice(0, MAX_TARGETS)
    create.mutate(
      {
        kind: prompts.some((p) => p.institution_id) ? "supplemental" : "personal_statement",
        title: title.trim(),
        prompt_text: "",
        word_limit: groupWordLimit(group),
        targets: prompts.map((p) => ({ institution_id: p.institution_id, position: p.position })),
      },
      {
        onSuccess: () => {
          toast.success(t("drafts.created"))
          onDone()
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }
  return (
    <form onSubmit={submit} className="border-hairline rounded-card animate-in fade-in flex flex-col gap-3 border p-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="draft-group">{t("drafts.groupLabel")}</Label>
        <Select
          items={groups.map((g) => ({ value: g.key, label: optionLabel(g) }))}
          value={key}
          onValueChange={(next) => next && setKey(next)}
        >
          <SelectTrigger id="draft-group" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.key} value={g.key}>
                {optionLabel(g)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {group && group.prompts.length > 1 ? (
        <p className="text-muted-foreground text-xs">{t("drafts.groupHint", { count: Math.min(group.prompts.length, MAX_TARGETS) })}</p>
      ) : null}
      <div className="flex flex-col gap-1">
        <Label htmlFor="draft-title">{t("drafts.titleLabel")}</Label>
        <Input id="draft-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={create.isPending || !group}>
          {t("drafts.create")}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("drafts.cancel")}
        </Button>
      </div>
    </form>
  )
}

/** The student's drafts of this step, each with the group critique and fork. */
export function Drafts({ children }: { children?: React.ReactNode }) {
  const t = useT("essayFlow")
  const query = useEssays()
  const essays = query.data?.items ?? []
  return (
    <section className="flex min-w-0 flex-col gap-3" aria-labelledby="drafts-title">
      <h3 id="drafts-title" className="text-base font-semibold">
        {t("drafts.title")}
      </h3>
      {children}
      {query.isPending ? (
        <Skeleton className="h-16 w-full" />
      ) : essays.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("drafts.empty")}</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {essays.map((e) => (
            <DraftCard key={e.id} essay={e} />
          ))}
        </ul>
      )}
    </section>
  )
}
