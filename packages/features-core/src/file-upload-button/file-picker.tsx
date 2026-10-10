"use client"

import { getMeFilesQuery, type FileItem, type FileTypeFilter } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, NativeSelect, NativeSelectOption, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useDeferredValue, useState } from "react"

/** The picker shows this many files per page. */
export const FILE_PICKER_PAGE_SIZE = 6

const TYPES: readonly FileTypeFilter[] = ["pdf", "doc", "sheet", "slides", "text", "image"]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Picks one of the caller's files: search by name, filter by type, sort recent or older, six per page with
 * Previous / Next. The filtering happens on the server (`GET /v1/me/files?q&type&sort&page&page_size`).
 */
export function FilePicker({
  onPick,
  disabled = false,
  enabled = true,
}: {
  onPick: (file: FileItem) => void
  disabled?: boolean
  /** False keeps the request from firing (a closed dialog). */
  enabled?: boolean
}) {
  const t = useT("files.picker")
  const [search, setSearch] = useState("")
  const [type, setType] = useState<FileTypeFilter | "">("")
  const [sort, setSort] = useState<"recent" | "older">("recent")
  const [page, setPage] = useState(1)
  const q = useDeferredValue(search.trim())
  const query = useQuery({
    ...getMeFilesQuery({
      ...(q ? { q } : {}),
      ...(type ? { type } : {}),
      sort,
      page,
      page_size: FILE_PICKER_PAGE_SIZE,
    }),
    enabled,
    placeholderData: (previous) => previous,
  })
  const files = query.data?.items.filter((file) => file.status === "ready") ?? []
  const hasNext = query.data?.next_cursor != null

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="search"
        value={search}
        aria-label={t("search")}
        placeholder={t("search")}
        className="h-11 md:h-8"
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <NativeSelect
          aria-label={t("type")}
          value={type}
          onChange={(event) => {
            setType(event.target.value as FileTypeFilter | "")
            setPage(1)
          }}
        >
          <NativeSelectOption value="">{t("allTypes")}</NativeSelectOption>
          {TYPES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {t(`types.${value}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label={t("sort")}
          value={sort}
          onChange={(event) => {
            setSort(event.target.value === "older" ? "older" : "recent")
            setPage(1)
          }}
        >
          <NativeSelectOption value="recent">{t("recent")}</NativeSelectOption>
          <NativeSelectOption value="older">{t("older")}</NativeSelectOption>
        </NativeSelect>
      </div>
      {query.isPending ? <StateView state="loading" rows={2} /> : null}
      {query.isError ? <StateView state="error" error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.isSuccess && files.length === 0 ? <StateView state="empty" emptyText={t("empty")} /> : null}
      <ul className="flex flex-col gap-1">
        {files.map((file) => (
          <li key={file.id}>
            <Button
              variant="ghost"
              className="h-auto min-h-11 w-full justify-between gap-3 py-2 text-left"
              disabled={disabled}
              onClick={() => onPick(file)}
            >
              <span className="min-w-0 truncate">{file.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">{formatSize(file.byte_size)}</span>
            </Button>
          </li>
        ))}
      </ul>
      <nav aria-label={t("pagination")} className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          className="min-h-11 md:min-h-8"
          disabled={page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          <Icons.chevronLeft aria-hidden />
          {t("previous")}
        </Button>
        <span className="text-muted-foreground text-xs tabular-nums">{t("page", { page })}</span>
        <Button variant="outline" className="min-h-11 md:min-h-8" disabled={!hasNext} onClick={() => setPage(page + 1)}>
          {t("next")}
          <Icons.chevronRight aria-hidden />
        </Button>
      </nav>
    </div>
  )
}
