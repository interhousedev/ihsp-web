"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { IconAlertTriangle, IconLoader2, IconX } from "@ihsp/ui"
import { useState, type DragEvent, type ReactNode } from "react"
import type { NotebookUploader, UploadRow } from "./use-upload-to-notebook"

type UploadDropZoneProps = {
  uploader: NotebookUploader
  className?: string
  /** Where the files still on their way are listed (default: under the content). */
  rows?: "top" | "bottom"
  children: ReactNode
}

function carriesFiles(event: DragEvent): boolean {
  const transfer = event.dataTransfer
  return Array.from(transfer?.types ?? []).includes("Files") || (transfer?.files?.length ?? 0) > 0
}

function UploadRowView({ row, onDismiss }: { row: UploadRow; onDismiss: (key: string) => void }) {
  const t = useT()
  if (row.phase === "failed") {
    return (
      <li role="alert" className="text-destructive flex items-start gap-2 text-xs">
        <IconAlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        <span className="min-w-0 flex-1 break-words">
          <span className="font-medium">{row.name}</span>
          {": "}
          {row.message}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 shrink-0"
          aria-label={t("files.upload.dismiss")}
          onClick={() => onDismiss(row.key)}
        >
          <IconX aria-hidden />
        </Button>
      </li>
    )
  }
  return (
    <li className="text-muted-foreground flex items-center gap-2 text-xs">
      <IconLoader2 aria-hidden className="size-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
      <span className="min-w-0 truncate">
        {row.phase === "uploading"
          ? t("files.upload.progress", { name: row.name })
          : t("notebooks.add.adding", { name: row.name })}
      </span>
      {row.phase === "uploading" ? (
        <span className="tabular-nums">{t("files.upload.percent", { percent: Math.round(row.fraction * 100) })}</span>
      ) : null}
    </li>
  )
}

/** Accepts files dropped on it, uploads them for the notebook and lists the files still on their way. */
export function UploadDropZone({ uploader, className, rows = "bottom", children }: UploadDropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const list =
    uploader.rows.length > 0 ? (
      <ul className="flex flex-col gap-1.5" aria-live="polite">
        {uploader.rows.map((row) => (
          <UploadRowView key={row.key} row={row} onDismiss={uploader.dismiss} />
        ))}
      </ul>
    ) : null
  return (
    <div
      className={cn("flex flex-col gap-3 transition-colors", dragging && "border-primary bg-primary/5", className)}
      onDragOver={(event) => {
        if (!carriesFiles(event)) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        setDragging(false)
        if (!carriesFiles(event)) return
        event.preventDefault()
        uploader.uploadDropped(Array.from(event.dataTransfer.files))
      }}
    >
      {rows === "top" ? list : null}
      {children}
      {rows === "bottom" ? list : null}
    </div>
  )
}
