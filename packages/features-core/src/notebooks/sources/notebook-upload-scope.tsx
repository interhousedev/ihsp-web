"use client"

import { useT } from "@ihsp/i18n"
import { createContext, useContext, type ReactNode } from "react"
import { cn } from "@ihsp/ui"
import { useFileDrop } from "./use-file-drop"
import { useUploadToNotebook, type NotebookUploader } from "./use-upload-to-notebook"

const UploaderContext = createContext<NotebookUploader | null>(null)

/** The uploader shared by the page, the Sources panel and the Add sources dialog (so their rows agree). */
export function useNotebookUploader(notebookId: string): NotebookUploader {
  const shared = useContext(UploaderContext)
  const local = useUploadToNotebook(notebookId)
  return shared ?? local
}

type NotebookUploadScopeProps = {
  notebookId: string
  canWrite: boolean
  children: ReactNode
}

/**
 * Wraps the whole notebook page: one uploader for it, and files dropped anywhere on the page upload at once, under
 * a drop overlay ("Drop files to add as sources"). A reader of a course workspace gets no drop.
 */
export function NotebookUploadScope({ notebookId, canWrite, children }: NotebookUploadScopeProps) {
  const t = useT("notebooks")
  const uploader = useUploadToNotebook(notebookId)
  const drop = useFileDrop((files) => uploader.uploadDropped(files), canWrite)
  return (
    <UploaderContext.Provider value={uploader}>
      <div
        className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col", drop.dragging && "cursor-copy")}
        onDragEnter={drop.handlers.onDragEnter}
        onDragOver={drop.handlers.onDragOver}
        onDragLeave={drop.handlers.onDragLeave}
        onDrop={drop.handlers.onDrop}
      >
        {children}
        {drop.dragging ? (
          <div
            role="status"
            className="border-primary bg-background/85 text-primary pointer-events-none absolute inset-2 z-50 flex items-center justify-center rounded-xl border-2 border-dashed text-sm font-medium"
          >
            {t("sources.dropToAdd")}
          </div>
        ) : null}
      </div>
    </UploaderContext.Provider>
  )
}
