"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Progress, cn } from "@ihsp/ui"
import { type DragEvent, useRef, useState } from "react"
import type { ReviewUpload } from "../../hooks/use-ai-review-uploads"

/** A drop area with a file button and the list of uploads, each with its progress and a remove button. */
export function UploadZone({
  items,
  refused,
  accept,
  hint,
  disabled = false,
  compact = false,
  onFiles,
  onRemove,
}: {
  items: readonly ReviewUpload[]
  refused: readonly string[]
  accept: string
  hint: string
  disabled?: boolean
  compact?: boolean
  onFiles: (files: File[]) => void
  onRemove: (key: string) => void
}) {
  const t = useT("player")
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (!disabled) onFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <div className="flex flex-col gap-2">
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- drop target only; the "Choose files" button inside is the keyboard path */}
      <div
        role="group"
        aria-label={t("aiReview.dropLabel")}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        data-dragging={dragging || undefined}
        className={cn(
          "border-border data-[dragging]:border-primary data-[dragging]:bg-primary/5 flex flex-col items-center gap-2 rounded-lg border border-dashed text-center transition-colors",
          compact ? "p-3" : "p-5",
        )}
      >
        {compact ? null : <Icons.upload aria-hidden className="text-muted-foreground size-6" />}
        <p className="text-sm">{t("aiReview.dropTitle")}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => input.current?.click()}
          className="min-h-11 md:min-h-8"
        >
          <Icons.paperclip aria-hidden />
          {t("aiReview.chooseFiles")}
        </Button>
        <input
          ref={input}
          type="file"
          multiple
          accept={accept}
          hidden
          tabIndex={-1}
          aria-label={t("aiReview.chooseFiles")}
          onChange={(event) => {
            onFiles(Array.from(event.target.files ?? []))
            event.target.value = ""
          }}
        />
      </div>
      {refused.length > 0 ? (
        <p role="alert" className="text-destructive text-xs">
          {t("aiReview.refused", { names: refused.join(", ") })}
        </p>
      ) : null}
      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5" aria-label={t("aiReview.attached")}>
          {items.map((item) => (
            <li key={item.key} className="flex flex-col gap-1 rounded-md border px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <Icons.page aria-hidden className="text-muted-foreground size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    item.status === "failed" || item.status === "rejected"
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {item.status === "uploading" ? `${item.progress}%` : t(`aiReview.upload.${item.status}`)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(item.key)}
                  aria-label={t("aiReview.removeFile", { name: item.name })}
                  className="size-11 shrink-0 md:size-7"
                >
                  <Icons.close aria-hidden />
                </Button>
              </div>
              {item.status === "uploading" ? (
                <Progress value={item.progress} aria-label={t("aiReview.uploadProgress", { name: item.name })} />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
