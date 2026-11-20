"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons, Pill, StateView } from "@ihsp/ui"
import { useState } from "react"
import { usePromptMap, type PromptGroup, type PromptRef } from "./api"
import { groupLabel } from "./group-label"
import { StepFooter } from "./step-footer"

function PromptRow({ prompt }: { prompt: PromptRef }) {
  const t = useT("essayFlow")
  return (
    <li className="flex min-w-0 flex-col gap-1 text-sm">
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="font-medium">{prompt.institution_name}</span>
        {prompt.in_list ? <Pill tone="primary">{t("map.inList")}</Pill> : null}
        {prompt.word_limit ? (
          <span className="text-muted-foreground text-xs">
            {t(prompt.limit_unit === "words" ? "map.words" : "map.chars", { count: prompt.word_limit })}
          </span>
        ) : null}
      </span>
      <span className="text-muted-foreground line-clamp-3 break-words">{prompt.prompt}</span>
    </li>
  )
}

function GroupCard({ group }: { group: PromptGroup }) {
  const t = useT("essayFlow")
  return (
    <li
      data-testid={`prompt-group-${group.key}`}
      className={cn(
        "bg-card rounded-card flex min-w-0 flex-col gap-3 border p-3",
        group.covered ? "border-success/40" : "border-hairline",
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold">{groupLabel(group)}</span>
        <Pill tone={group.covered ? "success" : "neutral"}>{t(group.covered ? "map.covered" : "map.open")}</Pill>
      </div>
      <ul className="flex flex-col gap-3">
        {group.prompts.map((p) => (
          <PromptRow key={p.key} prompt={p} />
        ))}
      </ul>
    </li>
  )
}

const INITIAL = 6

function Section({ kind, groups }: { kind: PromptGroup["kind"]; groups: PromptGroup[] }) {
  const t = useT("essayFlow")
  const [all, setAll] = useState(false)
  if (groups.length === 0) return null
  const shown = all ? groups : groups.slice(0, INITIAL)
  return (
    <section className="flex min-w-0 flex-col gap-2" aria-labelledby={`map-${kind}`}>
      <div>
        <h3 id={`map-${kind}`} className="text-base font-semibold">
          {t(`map.${kind}.title`)} <span className="text-muted-foreground text-sm font-normal">({groups.length})</span>
        </h3>
        <p className="text-muted-foreground text-sm">{t(`map.${kind}.hint`)}</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {shown.map((g) => (
          <GroupCard key={g.key} group={g} />
        ))}
      </ul>
      {groups.length > INITIAL ? (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setAll(!all)}>
          {all ? t("map.showLess") : t("map.showAll", { count: groups.length })}
        </Button>
      ) : null}
    </section>
  )
}

/** Step 1: every prompt of the catalog, grouped by what one essay can answer at once. */
export function PromptMapStep({ onNext }: { onNext?: () => void }) {
  const t = useT("essayFlow")
  const query = usePromptMap()
  if (query.isPending) return <StateView state="loading" rows={3} />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  const groups = query.data.groups
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm">{t("map.intro")}</p>
      {!query.data.available ? (
        <p role="note" className="text-muted-foreground flex items-center gap-2 text-sm">
          <Icons.info aria-hidden className="size-4 shrink-0" />
          {t("map.unavailable")}
        </p>
      ) : null}
      {groups.length === 0 ? (
        <StateView state="empty" icon={<Icons.post aria-hidden />} title={t("map.emptyTitle")} description={t("map.emptyText")} />
      ) : (
        (["common", "shared", "unique"] as const).map((kind) => (
          <Section key={kind} kind={kind} groups={groups.filter((g) => g.kind === kind)} />
        ))
      )}
      <StepFooter next="practice" onNext={onNext} />
    </div>
  )
}
