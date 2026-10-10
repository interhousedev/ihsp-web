"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, formatBytes } from "@ihsp/ui"
import { IconFileTypePdf, IconUpload } from "@ihsp/ui"
import { useId, useRef, type ChangeEvent } from "react"
import type { UploadLimits } from "./upload-config"

/** What the PDF step accepts: a PDF, and for teachers DOCX and PPTX (offered as downloads, § 3.5). */
export const PDF_ACCEPT = ".pdf,application/pdf"
export const OFFICE_ACCEPT = `${PDF_ACCEPT},.docx,.pptx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation`

/**
 * Chooses one file. Shows the chosen file with its size, a warning when it is above the limit of the role (a hint:
 * the server decides) and a button to replace or remove it. `existing` describes the file a saved item already holds.
 */
export function FilePick({
  file,
  onChange,
  accept,
  limits,
  withOffice,
  invalid = false,
  describedBy,
  existing,
}: {
  file: File | null
  onChange: (file: File | null) => void
  accept: string
  limits: UploadLimits
  /** Teachers: DOCX and PPTX are allowed too. */
  withOffice: boolean
  invalid?: boolean
  describedBy?: string
  existing?: { bytes: number; pages: number | null } | null
}) {
  const t = useT("library.upload.pdf")
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const tooLarge = file !== null && file.size > limits.bytes

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null
    event.target.value = ""
    if (chosen) onChange(chosen)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="min-h-11"
          variant={file || existing ? "outline" : "default"}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          onClick={() => input.current?.click()}
        >
          <IconUpload aria-hidden />
          {file || existing ? t("replace") : withOffice ? t("chooseOffice") : t("choose")}
        </Button>
        <input
          ref={input}
          id={inputId}
          type="file"
          accept={accept}
          tabIndex={-1}
          aria-hidden
          data-testid="pdf-input"
          className="sr-only"
          onChange={onFile}
        />
        <p className="text-muted-foreground text-xs">
          {withOffice
            ? t("hintOffice", { size: formatBytes(limits.bytes) })
            : t("hint", { size: formatBytes(limits.bytes), pages: limits.pages ?? 0 })}
        </p>
      </div>
      {file ? (
        <div className="bg-card flex items-center gap-3 rounded-xl border p-3" data-testid="chosen-file">
          <IconFileTypePdf className="size-6 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-muted-foreground text-xs">{formatBytes(file.size, { decimals: 1 })}</p>
          </div>
          <Button type="button" variant="ghost" className="text-destructive min-h-11" onClick={() => onChange(null)}>
            <Icons.trash aria-hidden />
            {t("remove")}
          </Button>
        </div>
      ) : existing ? (
        <div className="bg-muted/40 flex items-center gap-3 rounded-xl border p-3" data-testid="existing-file">
          <IconFileTypePdf className="size-6 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t("current")}</p>
            <p className="text-muted-foreground text-xs">
              {existing.pages ? `${t("pages", { count: existing.pages })} · ` : ""}
              {formatBytes(existing.bytes, { decimals: 1 })}
            </p>
          </div>
        </div>
      ) : null}
      {tooLarge ? (
        <p role="alert" className="text-destructive text-sm">
          {t("tooLarge", { size: formatBytes(limits.bytes) })}
        </p>
      ) : null}
    </div>
  )
}
