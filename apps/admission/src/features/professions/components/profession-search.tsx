"use client"

import { useLocale, useT } from "@ihsp/i18n"
import { Icons, Input, Skeleton, StateView, useDebounce } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { searchProfessionsQuery, type Profession } from "../api"
import { ExposureNote, ProfessionCard } from "./profession-card"

/** Step 2: search or browse the catalogue; each card adds the profession to the ranking. */
export function ProfessionSearch({
  pickedIds,
  full,
  fieldLabel,
  onAdd,
}: {
  pickedIds: readonly string[]
  full: boolean
  fieldLabel: (key: string) => string
  onAdd: (profession: Profession) => void
}) {
  const t = useT("professions")
  const locale = useLocale()
  const [q, setQ] = useState("")
  const term = useDebounce(q.trim(), 300)
  const list = useQuery(searchProfessionsQuery(term, locale))
  const items = list.data?.items ?? []
  return (
    <div className="flex flex-col gap-3">
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
      <ExposureNote />
      {list.isPending ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-card" />
          ))}
        </div>
      ) : list.isError ? (
        <StateView state="error" error={list.error} onRetry={() => void list.refetch()} />
      ) : items.length === 0 ? (
        <StateView state="empty" emptyText={t("search.empty")} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2" aria-label={t("search.results")}>
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
      )}
    </div>
  )
}
