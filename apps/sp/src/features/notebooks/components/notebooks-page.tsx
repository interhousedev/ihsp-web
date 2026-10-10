"use client"

import type { NotebookItem } from "@ihsp/api"
import {
  groupNotebooks,
  NOTEBOOK_FOLDERS,
  parseNotebookFolder,
  useAllNotebooks,
  type NotebookFolder,
} from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, PageContainer, Skeleton, StateView, cn, useDebounce } from "@ihsp/ui"
import { IconSearch } from "@ihsp/ui"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { NewNotebookButton } from "./new-notebook-button"
import { NotebookCard } from "./notebook-card"

const SEARCH_DELAY_MS = 300
/** A folder with more notebooks than this starts collapsed; My notebooks starts open whatever its size. */
const COLLAPSE_ABOVE = 6
/** Past this many cards a folder is paged: the rest is revealed in steps of this size. */
const PAGE_SIZE = 48
const GRID = "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

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

/** One folder: a collapsible header with the folder icon, its title and the count, then its notebooks as compact cards. */
function FolderSection({
  folder,
  items,
  open,
  onToggle,
}: {
  folder: NotebookFolder
  items: readonly NotebookItem[]
  open: boolean
  onToggle: () => void
}) {
  const t = useT("notebooks")
  const [visible, setVisible] = useState(PAGE_SIZE)
  const title = t(`list.folders.${folder}`)
  const bodyId = `notebook-folder-${folder}`

  return (
    <section data-folder={folder} className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
          className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-start outline-none focus-visible:ring-2 md:min-h-8"
        >
          <Icons.folder aria-hidden className="text-muted-foreground size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{title}</span>
          <span className="text-muted-foreground font-normal tabular-nums">{items.length}</span>
          <Icons.chevronDown
            aria-hidden
            className={cn("text-muted-foreground size-4 shrink-0 transition-transform", !open && "-rotate-90")}
          />
        </button>
      </h2>
      {open ? (
        <div id={bodyId} className="flex flex-col gap-2">
          <ul className={GRID} aria-label={title}>
            {folder === "mine" ? (
              <li>
                <NewNotebookButton variant="tile" />
              </li>
            ) : null}
            {items.slice(0, visible).map((notebook) => (
              <NotebookCard key={notebook.id} notebook={notebook} compact />
            ))}
          </ul>
          {items.length > visible ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 self-center"
              onClick={() => setVisible((n) => n + PAGE_SIZE)}
            >
              {t("list.showMore")} ({items.length - visible})
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

/** `/notebooks/`: the student's notebooks in three folders (subject, LMS, my own), a search field and New notebook (docs § 5.3). */
export function NotebooksPage() {
  const t = useT("notebooks")
  const [search, setSearch] = useState("")
  const query = useDebounce(search.trim(), SEARCH_DELAY_MS)
  const notebooks = useAllNotebooks(query)
  const all = notebooks.items
  const folderParam = parseNotebookFolder(useSearchParams().get("folder"))
  const groups = groupNotebooks(all)
  // The student's own open or closed choice per folder; until then the default: the folder named in the link, My
  // notebooks, and any folder of at most COLLAPSE_ABOVE notebooks are open.
  const [choice, setChoice] = useState<Partial<Record<NotebookFolder, boolean>>>({})
  const isOpen = (folder: NotebookFolder) =>
    choice[folder] ?? (folder === folderParam || folder === "mine" || groups[folder].length <= COLLAPSE_ABOVE)

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
      {notebooks.isSuccess && all.length === 0 && query === "" ? (
        <StateView state="empty" emptyText={t("list.empty")} action={<NewNotebookButton />} />
      ) : null}
      {notebooks.isSuccess && all.length === 0 && query !== "" ? (
        <StateView state="empty" emptyText={t("list.noResults", { query })} />
      ) : null}
      {all.length > 0 ? (
        <div className="flex flex-col gap-5">
          {NOTEBOOK_FOLDERS.filter((folder) => folder === "mine" || groups[folder].length > 0).map((folder) => (
            <FolderSection
              key={folder}
              folder={folder}
              items={groups[folder]}
              open={isOpen(folder)}
              onToggle={() => setChoice((current) => ({ ...current, [folder]: !isOpen(folder) }))}
            />
          ))}
        </div>
      ) : null}
    </PageContainer>
  )
}
