"use client"

import { uploadFile, type FileItem, type FileUploadPurpose } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Progress } from "@ihsp/ui"
import { IconAlertTriangle, IconPaperclip, IconUpload, IconX } from "@tabler/icons-react"
import { useRef, useState, type ChangeEvent } from "react"
import { useRejectReason } from "./use-reject-reason"

/** File types FILE-4 allows; the backend checks the real type after the upload. */
export const UPLOAD_ACCEPT = ".pdf,.docx,.pptx,.xlsx,.txt,.md,.png,.jpg,.jpeg"

export type FileUploadButtonProps = {
  purpose: FileUploadPurpose
  /** Called once per file that the backend verified (`status: "ready"`). */
  onUploaded: (file: FileItem) => void
  /** Called after every file finished, whatever the result (refresh lists here). `file` is null when the upload failed. */
  onSettled?: (file: FileItem | null) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  /** Visible text; defaults to "Upload files". */
  label?: string
  /** Paperclip button without text (the label stays as the accessible name). */
  iconOnly?: boolean
  variant?: "default" | "outline" | "secondary" | "ghost"
}

type UploadRow = {
  key: string
  name: string
  phase: "uploading" | "checking" | "failed" | "rejected"
  fraction: number
  message: string | null
}

let rowCounter = 0

/** Upload button with one progress row per file and the reason when the backend refuses or rejects a file. */
export function FileUploadButton({
  purpose,
  onUploaded,
  onSettled,
  accept = UPLOAD_ACCEPT,
  multiple = false,
  disabled = false,
  label,
  iconOnly = false,
  variant = "outline",
}: FileUploadButtonProps) {
  const t = useT("files.upload")
  const errorMessage = useErrorMessage()
  const rejectReason = useRejectReason()
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<UploadRow[]>([])

  const text = label ?? t("button")

  function patchRow(key: string, patch: Partial<UploadRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  async function upload(file: File) {
    rowCounter += 1
    const key = `upload-${rowCounter}`
    setRows((current) => [...current, { key, name: file.name, phase: "uploading", fraction: 0, message: null }])
    try {
      const result = await uploadFile(file, purpose, (fraction) =>
        patchRow(key, { fraction, phase: fraction >= 1 ? "checking" : "uploading" }),
      )
      if (result.status === "rejected") {
        patchRow(key, { phase: "rejected", message: rejectReason(result.reject_reason) })
        onSettled?.(result)
        return
      }
      removeRow(key)
      onUploaded(result)
      onSettled?.(result)
    } catch (error) {
      patchRow(key, { phase: "failed", message: errorMessage(error) })
      onSettled?.(null)
    }
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    for (const file of files) void upload(file)
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="file-upload-input"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onChange}
      />
      <Button
        type="button"
        variant={variant}
        size={iconOnly ? "icon" : "default"}
        className={iconOnly ? "size-11" : "min-h-11 px-4"}
        disabled={disabled}
        aria-label={iconOnly ? text : undefined}
        onClick={() => inputRef.current?.click()}
      >
        {iconOnly ? <IconPaperclip aria-hidden /> : <IconUpload aria-hidden />}
        {iconOnly ? null : text}
      </Button>
      {rows.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {rows.map((row) => (
            <li key={row.key} className="bg-muted/50 flex flex-col gap-1 rounded-lg border p-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate font-medium">{row.name}</span>
                {row.phase === "failed" || row.phase === "rejected" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("dismiss")}
                    onClick={() => removeRow(row.key)}
                  >
                    <IconX aria-hidden />
                  </Button>
                ) : null}
              </div>
              {row.phase === "uploading" || row.phase === "checking" ? (
                <>
                  <Progress value={Math.round(row.fraction * 100)} aria-label={t("progress", { name: row.name })} />
                  <span className="text-muted-foreground text-xs">
                    {row.phase === "checking"
                      ? t("checking")
                      : t("percent", { percent: Math.round(row.fraction * 100) })}
                  </span>
                </>
              ) : (
                <p role="alert" className="text-destructive flex items-start gap-1 text-xs">
                  <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{row.phase === "rejected" ? t("rejected", { reason: row.message ?? "" }) : row.message}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
