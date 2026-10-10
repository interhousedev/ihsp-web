"use client"

import type { FileItem } from "@ihsp/api"
import { FileUploadButton } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, PageContainer, StateView } from "@ihsp/ui"
import { useState } from "react"
import { useMyFiles, useRefreshFiles } from "../hooks/use-my-files"
import { DeleteFileDialog } from "./delete-file-dialog"
import { FileRow } from "./file-row"
import { RenameFileDialog } from "./rename-file-dialog"
import { StorageCard } from "./storage-card"

/** `/files/`: quota, multi-file upload with progress, and the list of files (WEB-21). */
export function FilesPage() {
  const t = useT("files.page")
  const files = useMyFiles()
  const refresh = useRefreshFiles()
  const [renaming, setRenaming] = useState<FileItem | null>(null)
  const [deleting, setDeleting] = useState<FileItem | null>(null)

  const items = files.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <PageContainer title={t("title")}>
      <StorageCard />
      <div className="w-full max-w-md">
        <FileUploadButton
          purpose="ai_upload"
          multiple
          label={t("upload")}
          variant="default"
          onSettled={refresh}
          onUploaded={() => undefined}
        />
      </div>
      {files.isPending ? <StateView state="loading" rows={3} /> : null}
      {files.isError ? <StateView state="error" error={files.error} onRetry={() => void files.refetch()} /> : null}
      {files.isSuccess && items.length === 0 ? <StateView state="empty" emptyText={t("empty")} /> : null}
      {items.length > 0 ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {items.map((file) => (
            <li key={file.id}>
              <FileRow file={file} onRename={setRenaming} onDelete={setDeleting} />
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
      <RenameFileDialog file={renaming} onClose={() => setRenaming(null)} />
      <DeleteFileDialog file={deleting} onClose={() => setDeleting(null)} />
    </PageContainer>
  )
}
