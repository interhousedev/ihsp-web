"use client"

import { useT } from "@ihsp/i18n"
import { Button, IconUpload, IconX, Progress, cn } from "@ihsp/ui"
import { useRef, useState, type DragEvent } from "react"
import { FEEDBACK_IMAGE_ACCEPT } from "./feedback-options"
import type { FeedbackAttachment, FeedbackAttachmentIssue } from "./use-feedback-attachments"

export type FeedbackAttachmentsFieldProps = {
  items: readonly FeedbackAttachment[]
  issue: FeedbackAttachmentIssue | null
  onFiles: (files: File[]) => void
  onRemove: (key: string) => void
  disabled?: boolean
}

/** Drop zone or picker for up to ten images, with a preview, a progress bar and a remove button per image. */
export function FeedbackAttachmentsField({
  items,
  issue,
  onFiles,
  onRemove,
  disabled = false,
}: FeedbackAttachmentsFieldProps) {
  const t = useT("feedback")
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    onFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{t("dialog.attachments")}</span>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-border flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center",
          dragging && "border-primary bg-muted",
        )}
      >
        <p className="text-muted-foreground text-sm">{dragging ? t("dialog.dropHere") : t("dialog.attachmentsHint")}</p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 md:min-h-8"
          disabled={disabled || items.length >= 10}
          onClick={() => inputRef.current?.click()}
        >
          <IconUpload aria-hidden />
          {t("dialog.chooseFiles")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={FEEDBACK_IMAGE_ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label={t("dialog.chooseFiles")}
          disabled={disabled}
          onChange={(event) => {
            onFiles(Array.from(event.target.files ?? []))
            event.target.value = ""
          }}
        />
      </div>
      {issue ? (
        <p role="alert" className="text-destructive text-sm">
          {issue === "tooMany" ? t("dialog.tooMany") : t("dialog.notImage")}
        </p>
      ) : null}
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 rounded-md border p-2">
              <img src={item.previewUrl} alt={item.name} className="size-14 shrink-0 rounded object-cover" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm">{item.name}</span>
                {item.status === "uploading" ? (
                  <Progress
                    value={Math.round(item.progress * 100)}
                    aria-label={t("dialog.uploading", { percent: Math.round(item.progress * 100) })}
                  />
                ) : null}
                {item.status === "uploading" ? (
                  <span className="text-muted-foreground text-xs">
                    {t("dialog.uploading", { percent: Math.round(item.progress * 100) })}
                  </span>
                ) : null}
                {item.status === "failed" ? (
                  <span role="alert" className="text-destructive text-xs">
                    {item.error === "rejected" ? t("dialog.uploadRejected") : t("dialog.uploadFailed")}
                  </span>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 md:size-8"
                aria-label={`${t("dialog.remove")} ${item.name}`}
                onClick={() => onRemove(item.key)}
              >
                <IconX aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
