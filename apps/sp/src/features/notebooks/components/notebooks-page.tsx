"use client"

import { groupNotebooks, NOTEBOOK_FOLDERS, parseNotebookFolder, useAllNotebooks, type NotebookFolder } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Input, PageContainer, Skeleton, StateView, cn, useDebounce } from "@ihsp/ui"
import { IconSearch } from "@ihsp/ui"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { NewNotebookButton } from "./new-notebook-button"
import { NotebookCard } from "./notebook-card"

const SEARCH_DELAY_MS = 300
/** Past this many cards the grid is paged: the rest is revealed in steps of this size. */
const PAGE_SIZE = 48
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
  const notebooks = useAllNotebooks(query)
  const all = notebooks.items
  const folderParam = parseNotebookFolder(useSearchParams().get("folder"))
  const [folder, setFolder] = useState<NotebookFolder | null>(folderParam)
  useEffect(() => setFolder(folderParam), [folderParam])
  const [visible, setVisible] = useState(PAGE_SIZE)
  useEffect(() => setVisible(PAGE_SIZE), [folder, query])
  const groups = groupNotebooks(all)
  const filtered = folder ? groups[folder] : all
  const items = filtered.slice(0, visible)

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

      <div role="group" aria-label={t("list.title")} className="flex flex-wrap gap-2">
        {[null, ...NOTEBOOK_FOLDERS].map((key) => {
          const label = key ? t(`list.folders.${key}`) : t("list.folders.all")
          const count = key ? groups[key].length : all.length
          return (
            <Button
              key={key ?? "all"}
              type="button"
              size="sm"
              variant={folder === key ? "default" : "outline"}
              aria-pressed={folder === key}
              className={cn("min-h-11 rounded-full md:min-h-8")}
              onClick={() => setFolder(key)}
            >
              {label} ({count})
            </Button>
          )
        })}
      </div>

      {notebooks.isPending ? <CardSkeletons /> : null}
      {notebooks.isError ? (
        <StateView state="error" error={notebooks.error} onRetry={() => void notebooks.refetch()} />
      ) : null}
      {notebooks.isSuccess && items.length === 0 && query === "" && folder === null ? (
        <StateView state="empty" emptyText={t("list.empty")} action={<NewNotebookButton />} />
      ) : null}
      {notebooks.isSuccess && items.length === 0 && (query !== "" || folder !== null) ? (
        <StateView state="empty" emptyText={query === "" ? t("list.empty") : t("list.noResults", { query })} />
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
      {filtered.length > visible ? (
        <Button type="button" variant="outline" className="min-h-11 self-center" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
          {t("list.showMore")} ({filtered.length - visible})
        </Button>
      ) : null}
    </PageContainer>
  )
}
