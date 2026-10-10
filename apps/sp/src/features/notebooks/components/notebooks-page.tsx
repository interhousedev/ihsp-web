"use client"

import { useNotebooks } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Input, PageContainer, Skeleton, StateView, useDebounce } from "@ihsp/ui"
import { IconSearch } from "@ihsp/ui"
import { useState } from "react"
import { NewNotebookButton } from "./new-notebook-button"
import { NotebookCard } from "./notebook-card"

const SEARCH_DELAY_MS = 300
const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

function CardSkeletons() {
  return (
    <ul className={GRID} aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <li key={index}>
          <Skeleton className="h-32 w-full rounded-xl" />
        </li>
      ))}
    </ul>
  )
}

/** `/notebooks/`: the student's notebooks (pinned first), a search field and a New notebook tile (docs § 5.3). */
export function NotebooksPage() {
  const t = useT("notebooks")
  const [search, setSearch] = useState("")
  const query = useDebounce(search.trim(), SEARCH_DELAY_MS)
  const notebooks = useNotebooks(query)
  const items = notebooks.data?.items ?? []

  return (
    <PageContainer title={t("list.title")} actions={<NewNotebookButton />}>
      <div className="relative max-w-md">
        <IconSearch
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          value={search}
          aria-label={t("list.search")}
          placeholder={t("list.search")}
          className="min-h-11 ps-9 md:min-h-9"
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {notebooks.isPending ? <CardSkeletons /> : null}
      {notebooks.isError ? (
        <StateView state="error" error={notebooks.error} onRetry={() => void notebooks.refetch()} />
      ) : null}
      {notebooks.isSuccess && items.length === 0 && query === "" ? (
        <StateView state="empty" emptyText={t("list.empty")} action={<NewNotebookButton />} />
      ) : null}
      {notebooks.isSuccess && items.length === 0 && query !== "" ? (
        <StateView state="empty" emptyText={t("list.noResults", { query })} />
      ) : null}
      {items.length > 0 ? (
        <ul className={GRID}>
          <li>
            <NewNotebookButton variant="tile" />
          </li>
          {items.map((notebook) => (
            <NotebookCard key={notebook.id} notebook={notebook} />
          ))}
        </ul>
      ) : null}
    </PageContainer>
  )
}
