"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { cn, Icons, Input, Skeleton, StateView, useDebounce } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { searchProfessionsQuery, type Profession } from "../api"
import { groupsOf, rankByFields, uniqueSources } from "../model"
import { ExposureNote, ProfessionCard } from "./profession-card"

/**
 * Step 2: search or browse the catalogue. Without a search the student's own fields come first, ISCO group chips
 * narrow the list, and the list scrolls inside its column so the ranking beside it stays in view.
 */
export function ProfessionSearch({
  pickedIds,
  full,
  fieldIds,
  fieldLabel,
  onAdd,
  className,
}: {
  pickedIds: readonly string[]
  full: boolean
  fieldIds: readonly string[]
  fieldLabel: (key: string) => string
  onAdd: (profession: Profession) => void
  className?: string
}) {
  const t = useT("professions")
  const locale = useLocale()
  const [q, setQ] = useState("")
  const [group, setGroup] = useState<string | null>(null)
  const term = useDebounce(q.trim(), 300)
  const list = useQuery(searchProfessionsQuery(term, locale))
  const all = useMemo(() => (term ? (list.data?.items ?? []) : rankByFields(list.data?.items ?? [], fieldIds)), [list.data, term, fieldIds])
  const groups = useMemo(() => groupsOf(all), [all])
  const items = group && groups.includes(group) ? all.filter((p) => p.group === group) : all
  const sources = uniqueSources(items)
  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col gap-2.5", className)}>
      <div className="relative">
        <Icons.search aria-hidden className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          className="ps-9"
        />
      </div>
      {groups.length > 1 ? (
        <div role="group" aria-label={t("search.groups")} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 md:mx-0 md:px-0 [scrollbar-width:none]">
          {[null, ...groups].map((id) => (
            <button
              key={id ?? "all"}
              type="button"
              aria-pressed={group === id}
              onClick={() => setGroup(id)}
              className="focus-visible:ring-ring aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:border-transparent bg-card hover:bg-muted min-h-8 shrink-0 rounded-full border px-3 text-xs font-medium whitespace-nowrap outline-none focus-visible:ring-2"
            >
              {id ?? t("search.allGroups")}
            </button>
          ))}
        </div>
      ) : null}
      {list.isPending ? (
        <div className="grid gap-2.5 xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-card" />
          ))}
        </div>
      ) : list.isError ? (
        <StateView state="error" error={list.error} onRetry={() => void list.refetch()} />
      ) : items.length === 0 ? (
        <StateView state="empty" emptyText={t("search.empty")} />
      ) : (
        <div className="-me-1 min-h-0 overflow-y-auto pe-1 lg:max-h-[calc(100dvh-20rem)]" tabIndex={-1}>
          <ul className="grid gap-2.5 xl:grid-cols-2" aria-label={t("search.results")}>
            {items.map((profession) => (
              <ProfessionCard
                key={profession.id}
                profession={profession}
                picked={pickedIds.includes(profession.id)}
                full={full}
                fieldLabel={fieldLabel}
                onAdd={() => onAdd(profession)}
              />
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-1">
            <ExposureNote />
            {sources.length > 0 ? (
              <p className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
                {t("card.sources")}:
                {sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
                    {s.label}
                  </a>
                ))}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
