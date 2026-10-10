"use client"

import {
  getAnnotations,
  getAnnotationsExport,
  getLibraryItemQuery,
  isApiError,
  keys,
  type AnnotationColor,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Input, StateView, ToggleGroup, ToggleGroupItem, useDebounce } from "@ihsp/ui"
import { IconFileExport } from "@ihsp/ui"
import { useInfiniteQuery, useMutation, useQueries } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { ANNOTATION_COLORS, COLOR_ICONS, COLOR_TEXT } from "../lib/colors"
import { byNewest } from "../lib/annotation-order"
import { downloadText, fileNameFor } from "../lib/download"
import { cn } from "@ihsp/ui"
import { NoteGroup } from "./note-group"

const PAGE_SIZE = 50
const ALL = "all"

/**
 * Every highlight, note and bookmark of the user, grouped by item (the item with the newest change first, the newest
 * notes first inside it), with search, a colour filter and **Export to Markdown**. Each note links into the reader at
 * its place. Notes are private; there is no notebook action here (notebooks take the item, not the notes).
 */
export function NotesTab() {
  const t = useT("library.notes")
  const errorMessage = useErrorMessage()
  const [draft, setDraft] = useState("")
  const [color, setColor] = useState<AnnotationColor | null>(null)
  const q = useDebounce(draft.trim(), 300)

  const query = useInfiniteQuery({
    queryKey: keys.library.annotations({ q, color, limit: PAGE_SIZE, paged: true }),
    queryFn: ({ pageParam, signal }) =>
      getAnnotations(
        {
          ...(q ? { q } : {}),
          ...(color ? { color } : {}),
          limit: PAGE_SIZE,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        { signal },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
  })

  const groups = useMemo(() => {
    const all = byNewest(query.data?.pages.flatMap((page) => page.items) ?? [])
    const order: string[] = []
    const byItem = new Map<string, typeof all>()
    for (const note of all) {
      const list = byItem.get(note.item_id)
      if (list) list.push(note)
      else {
        byItem.set(note.item_id, [note])
        order.push(note.item_id)
      }
    }
    return order.map((id) => ({ id, notes: byItem.get(id)! }))
  }, [query.data])

  const items = useQueries({
    queries: groups.map((group) => ({
      ...getLibraryItemQuery(group.id),
      staleTime: 5 * 60_000,
      retry: false,
    })),
  })

  const exporting = useMutation({
    mutationFn: async (target: { itemId?: string; title?: string }) => ({
      text: await getAnnotationsExport(target.itemId ? { item_id: target.itemId } : undefined),
      title: target.title,
    }),
    onSuccess: ({ text, title }) => {
      downloadText(fileNameFor(title ?? t("exportName"), "md"), text)
      toast.success(t("exported"))
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const filtered = q !== "" || color !== null
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          role="search"
          aria-label={t("searchLabel")}
          className="flex-1 sm:max-w-sm"
          onSubmit={(event) => event.preventDefault()}
        >
          <Input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label={t("searchLabel")}
            placeholder={t("search")}
            className="min-h-11 md:min-h-8"
          />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            aria-label={t("color")}
            value={[color ?? ALL]}
            onValueChange={(value) => {
              const next = value[0]
              if (next === ALL || next === undefined) setColor(null)
              else if ((ANNOTATION_COLORS as readonly string[]).includes(next)) setColor(next as AnnotationColor)
            }}
          >
            <ToggleGroupItem value={ALL} className="min-h-11 px-3 md:min-h-8">
              {t("allColors")}
            </ToggleGroupItem>
            {ANNOTATION_COLORS.map((name) => {
              const Icon = COLOR_ICONS[name]
              return (
                <ToggleGroupItem key={name} value={name} aria-label={t(`colors.${name}`)} className="size-11 md:size-8">
                  <Icon className={cn("size-4", COLOR_TEXT[name])} aria-hidden />
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 md:min-h-8"
            disabled={exporting.isPending || groups.length === 0}
            onClick={() => exporting.mutate({})}
          >
            <IconFileExport aria-hidden />
            {t("export")}
          </Button>
        </div>
      </div>

      {query.isPending ? (
        <StateView state="loading" rows={3} />
      ) : query.isError ? (
        <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
      ) : groups.length === 0 ? (
        <StateView state="empty" emptyText={filtered ? t("emptyFiltered") : t("empty")} />
      ) : (
        <>
          <p aria-live="polite" className="text-muted-foreground text-sm">
            {t("count", { count: groups.reduce((sum, group) => sum + group.notes.length, 0) })}
          </p>
          <div className="flex flex-col gap-3">
            {groups.map((group, index) => {
              const detail = items[index]
              const gone = detail?.isError === true && (!isApiError(detail.error) || detail.error.status !== 0)
              return (
                <NoteGroup
                  key={group.id}
                  itemId={group.id}
                  title={detail?.data?.title}
                  unavailable={gone}
                  notes={group.notes}
                  exporting={exporting.isPending}
                  onExport={() =>
                    exporting.mutate({ itemId: group.id, ...(detail?.data?.title ? { title: detail.data.title } : {}) })
                  }
                />
              )
            })}
          </div>
        </>
      )}
      {query.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 self-center md:min-h-8"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t("showMore")}
        </Button>
      ) : null}
    </div>
  )
}
