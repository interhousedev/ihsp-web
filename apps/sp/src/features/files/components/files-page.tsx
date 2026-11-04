"use client"

import type { FileItem } from "@ihsp/api"
import { FileUploadButton, type FileUploadControl } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  IconUpload,
  PageContainer,
  StateView,
  cn,
} from "@ihsp/ui"
import { useDeferredValue, useRef, useState, type DragEvent } from "react"
import { useMyFiles, useRefreshFiles } from "../hooks/use-my-files"
import { FILE_TABS, fileFilters, type FileTab, type FileTypeOption, type FileView } from "../utils/file-filters"
import { DeleteFileDialog } from "./delete-file-dialog"
import { FileCard } from "./file-card"
import { FileListRow } from "./file-list-row"
import { FilesToolbar } from "./files-toolbar"
import { RenameFileDialog } from "./rename-file-dialog"
import { StorageCard } from "./storage-card"

/**
 * `/files/`: My files. Search, a file-type filter and purpose tabs are server filters; the grid or list shows every
 * file with its actions; files can be chosen with New or dropped on the page, and each upload shows its progress.
 */
export function FilesPage() {
  const t = useT("files.page")
  const tDrive = useT("files.drive")
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<FileTab>("all")
  const [typeOption, setTypeOption] = useState<FileTypeOption>("all")
  const [view, setView] = useState<FileView>("grid")
  const [storageOpen, setStorageOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [renaming, setRenaming] = useState<FileItem | null>(null)
  const [deleting, setDeleting] = useState<FileItem | null>(null)
  const uploader = useRef<FileUploadControl>(null)
  const q = useDeferredValue(search.trim())
  const filters = fileFilters({ tab, typeOption, q })
  const filtered = Object.keys(filters).length > 0
  const files = useMyFiles(filters)
  const refresh = useRefreshFiles()

  const items = files.data?.pages.flatMap((page) => page.items) ?? []

  function dropFiles(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const dropped = Array.from(event.dataTransfer.files)
    if (dropped.length > 0) uploader.current?.upload(dropped)
  }

  return (
    <PageContainer title={t("title")}>
      <FilesToolbar
        search={search}
        onSearch={setSearch}
        typeOption={typeOption}
        onTypeOption={setTypeOption}
        view={view}
        onView={setView}
        onUpload={() => uploader.current?.open()}
        onStorage={() => setStorageOpen(true)}
      />

      <div role="group" aria-label={t("tabsLabel")} className="flex flex-wrap gap-2">
        {FILE_TABS.map((entry) => (
          <Button
            key={entry.id}
            type="button"
            size="sm"
            variant={tab === entry.id ? "secondary" : "outline"}
            className="min-h-11 rounded-full px-4 md:min-h-8"
            aria-pressed={tab === entry.id}
            onClick={() => setTab(entry.id)}
          >
            {t(`tabs.${entry.id}`)}
          </Button>
        ))}
      </div>

      <FileUploadButton
        hideTrigger
        controlRef={uploader}
        purpose="ai_upload"
        multiple
        label={t("upload")}
        onSettled={refresh}
        onUploaded={() => undefined}
      />

      <div
        data-testid="files-dropzone"
        className={cn(
          "relative flex min-h-48 flex-col gap-3 rounded-xl border border-transparent p-1",
          dragging && "border-primary bg-primary/5 border-dashed",
        )}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={dropFiles}
      >
        {dragging ? (
          <p className="text-primary pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 text-sm font-medium">
            <IconUpload aria-hidden className="size-4" />
            {tDrive("drop")}
          </p>
        ) : null}
        {files.isPending ? <StateView state="loading" rows={3} /> : null}
        {files.isError ? <StateView state="error" error={files.error} onRetry={() => void files.refetch()} /> : null}
        {files.isSuccess && items.length === 0 ? (
          <StateView state="empty" emptyText={filtered ? tDrive("empty") : t("empty")} />
        ) : null}
        {items.length > 0 ? (
          <ul
            aria-label={tDrive("files")}
            data-view={view}
            className={cn(
              view === "grid"
                ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                : "flex flex-col gap-2",
            )}
          >
            {items.map((file) => (
              <li key={file.id} className="min-w-0">
                {view === "grid" ? (
                  <FileCard file={file} onRename={setRenaming} onDelete={setDeleting} />
                ) : (
                  <FileListRow file={file} onRename={setRenaming} onDelete={setDeleting} />
                )}
              </li>
            ))}
          </ul>
        ) : null}
        {files.hasNextPage ? (
          <div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={files.isFetchingNextPage}
              onClick={() => void files.fetchNextPage()}
            >
              {t("loadMore")}
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={storageOpen} onOpenChange={setStorageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("storage")}</DialogTitle>
          </DialogHeader>
          <StorageCard />
        </DialogContent>
      </Dialog>
      <RenameFileDialog file={renaming} onClose={() => setRenaming(null)} />
      <DeleteFileDialog file={deleting} onClose={() => setDeleting(null)} />
    </PageContainer>
  )
}
