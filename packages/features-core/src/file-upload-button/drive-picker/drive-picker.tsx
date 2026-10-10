"use client"

import { getMeFiles, keys, uploadFile, type FileItem, type FileUploadPurpose } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  IconCheck,
  IconLayoutGrid,
  IconList,
  IconSearch,
  IconUpload,
  Input,
  NativeSelect,
  NativeSelectOption,
  StateView,
  cn,
} from "@ihsp/ui"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { useDeferredValue, useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import { FileUploadButton, UPLOAD_ACCEPT } from "../file-upload-button"
import { DRIVE_TYPE_GROUPS, formatFileSize, type DriveTypeGroup } from "./file-kind"
import { FilePreview } from "./file-preview"
import { FileKindIcon, FileThumb } from "./file-visual"

/** The picker loads this many files at a time. */
export const DRIVE_PICKER_PAGE_SIZE = 24

export type DrivePickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the chosen files when the person confirms. */
  onSelect: (files: FileItem[]) => void
  /** Several files at once; one file by default. */
  multiple?: boolean
  /** What newly uploaded files are for; "link" suits attachments. */
  uploadPurpose?: FileUploadPurpose
  accept?: string
  /** Disables the confirm button, for example while the caller saves. */
  busy?: boolean
  title?: string
  confirmLabel?: string
}

/**
 * Drive-like picker of the caller's files: search by name, type filter, recent or older first, grid or list,
 * preview pane, multi-select, upload (button or drop) and 24 files per page loaded as you scroll.
 */
export function DrivePicker({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  uploadPurpose = "link",
  accept = UPLOAD_ACCEPT,
  busy = false,
  title,
  confirmLabel,
}: DrivePickerProps) {
  const t = useT("files.drive")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [group, setGroup] = useState<DriveTypeGroup>("all")
  const [sort, setSort] = useState<"recent" | "older">("recent")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [selected, setSelected] = useState<FileItem[]>([])
  const [focused, setFocused] = useState<FileItem | null>(null)
  const [dragging, setDragging] = useState(false)
  const [dropUploads, setDropUploads] = useState(0)
  const [dropError, setDropError] = useState<string | null>(null)
  const q = useDeferredValue(search.trim())
  const type = DRIVE_TYPE_GROUPS.find((entry) => entry.id === group)?.type ?? null
  const filters = { ...(q ? { q } : {}), ...(type ? { type } : {}), sort, page_size: DRIVE_PICKER_PAGE_SIZE }

  const query = useInfiniteQuery({
    queryKey: [...keys.me.files(filters), "drive"],
    queryFn: ({ pageParam, signal }) => getMeFiles({ ...filters, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last, _all, lastParam) => (last.next_cursor != null ? lastParam + 1 : undefined),
    enabled: open,
  })
  const files = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items).filter((file) => file.status === "ready"),
    [query.data],
  )

  const sentinel = useRef<HTMLDivElement>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  useEffect(() => {
    const node = sentinel.current
    if (!node || !hasNextPage || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage) void fetchNextPage()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, files.length])

  function toggle(file: FileItem) {
    setFocused(file)
    setSelected((current) => {
      const has = current.some((entry) => entry.id === file.id)
      if (!multiple) return has ? [] : [file]
      return has ? current.filter((entry) => entry.id !== file.id) : [...current, file]
    })
  }

  function uploaded(file: FileItem) {
    setFocused(file)
    setSelected((current) => (multiple ? [...current.filter((entry) => entry.id !== file.id), file] : [file]))
    void queryClient.invalidateQueries({ queryKey: ["me", "files"] })
  }

  async function dropFiles(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    const dropped = Array.from(event.dataTransfer.files)
    if (dropped.length === 0) return
    setDropError(null)
    for (const file of multiple ? dropped : dropped.slice(0, 1)) {
      setDropUploads((count) => count + 1)
      try {
        const result = await uploadFile(file, uploadPurpose)
        if (result.status === "ready") uploaded(result)
        else setDropError(t("rejected", { name: file.name }))
      } catch (error) {
        setDropError(errorMessage(error))
      } finally {
        setDropUploads((count) => count - 1)
      }
    }
  }

  function confirm() {
    if (selected.length > 0) onSelect(selected)
  }

  const isSelected = (file: FileItem) => selected.some((entry) => entry.id === file.id)
  const shown = focused ?? selected[selected.length - 1] ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col gap-3 overflow-hidden",
          "max-sm:inset-0 max-sm:h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
          "sm:h-[min(44rem,90dvh)] sm:max-w-5xl",
        )}
      >
        <DialogHeader>
          <DialogTitle>{title ?? t("title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-48">
            <IconSearch
              aria-hidden
              className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            />
            <Input
              type="search"
              value={search}
              aria-label={t("search")}
              placeholder={t("search")}
              className="h-11 pl-8 md:h-8"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <NativeSelect
            aria-label={t("type")}
            value={group}
            onChange={(event) => setGroup(event.target.value as DriveTypeGroup)}
          >
            {DRIVE_TYPE_GROUPS.map((entry) => (
              <NativeSelectOption key={entry.id} value={entry.id}>
                {t(`types.${entry.id}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label={t("sort")}
            value={sort}
            onChange={(event) => setSort(event.target.value === "older" ? "older" : "recent")}
          >
            <NativeSelectOption value="recent">{t("recent")}</NativeSelectOption>
            <NativeSelectOption value="older">{t("older")}</NativeSelectOption>
          </NativeSelect>
          <div className="flex gap-1" role="group" aria-label={t("view")}>
            <Button
              type="button"
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="size-11 md:size-8"
              aria-label={t("grid")}
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <IconLayoutGrid aria-hidden />
            </Button>
            <Button
              type="button"
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-11 md:size-8"
              aria-label={t("list")}
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <IconList aria-hidden />
            </Button>
          </div>
          <FileUploadButton
            purpose={uploadPurpose}
            accept={accept}
            multiple={multiple}
            label={t("upload")}
            className="md:min-h-8"
            onUploaded={uploaded}
          />
        </div>

        <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[1fr_16rem]">
          <div
            className={cn(
              "relative min-h-0 overflow-y-auto rounded-lg border p-2",
              dragging && "border-primary bg-primary/5 border-dashed",
            )}
            data-testid="drive-dropzone"
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => void dropFiles(event)}
          >
            {dragging ? (
              <p className="text-primary pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 text-sm font-medium">
                <IconUpload aria-hidden className="size-4" />
                {t("drop")}
              </p>
            ) : null}
            {dropUploads > 0 ? (
              <p role="status" className="text-muted-foreground px-1 pb-2 text-xs">
                {t("uploading", { count: dropUploads })}
              </p>
            ) : null}
            {dropError ? (
              <p role="alert" className="text-destructive px-1 pb-2 text-xs">
                {dropError}
              </p>
            ) : null}
            {query.isPending ? <StateView state="loading" rows={3} /> : null}
            {query.isError ? (
              <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
            ) : null}
            {query.isSuccess && files.length === 0 ? <StateView state="empty" emptyText={t("empty")} /> : null}
            <ul
              className={cn(
                view === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" : "flex flex-col gap-1",
              )}
              aria-label={t("files")}
            >
              {files.map((file) => (
                <li key={file.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected(file)}
                    aria-label={file.name}
                    title={file.name}
                    className={cn(
                      "focus-visible:ring-ring relative w-full rounded-lg border text-left outline-none focus-visible:ring-2",
                      view === "grid"
                        ? "flex flex-col overflow-hidden"
                        : "flex min-h-11 items-center gap-3 px-2 py-1.5",
                      isSelected(file) ? "border-primary bg-primary/5" : "hover:bg-muted/60",
                    )}
                    onClick={() => toggle(file)}
                  >
                    {view === "grid" ? (
                      <>
                        <FileThumb file={file} className="aspect-[4/3] w-full" />
                        <span className="flex items-center gap-1.5 p-2 text-xs">
                          <FileKindIcon file={file} className="size-4" />
                          <span className="min-w-0 truncate">{file.name}</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <FileKindIcon file={file} className="text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{file.name}</span>
                        <span className="text-muted-foreground shrink-0 text-xs">{formatFileSize(file.byte_size)}</span>
                      </>
                    )}
                    {isSelected(file) ? (
                      <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full">
                        <IconCheck aria-hidden className="size-3.5" />
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
            <div ref={sentinel} className="flex justify-center py-2">
              {hasNextPage ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 md:min-h-8"
                  disabled={isFetchingNextPage}
                  onClick={() => void fetchNextPage()}
                >
                  {t("loadMore")}
                </Button>
              ) : null}
            </div>
          </div>
          <aside className="hidden min-h-0 overflow-y-auto md:block" aria-label={t("preview")}>
            {shown ? <FilePreview file={shown} /> : <p className="text-muted-foreground text-sm">{t("noPreview")}</p>}
          </aside>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-sm" aria-live="polite">
            {t("selected", { count: selected.length })}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              className="min-h-11 md:min-h-8"
              disabled={selected.length === 0 || busy}
              onClick={confirm}
            >
              {confirmLabel ?? t("confirm")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
