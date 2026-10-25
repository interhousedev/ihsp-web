"use client"

import { uploadFile, type FileItem, type FileUploadPurpose } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Progress, cn } from "@ihsp/ui"
import { IconUpload } from "@ihsp/ui"
import { useRef, useState, type DragEvent } from "react"
import { useRejectReason } from "../../../file-upload-button"

type Phase =
  | { name: "idle" }
  | { name: "uploading"; file: string; fraction: number }
  | { name: "failed"; file: string; message: string }

/**
 * A drop zone with a **Choose file** button (the button is the keyboard path). The file goes straight to the object
 * store with `uploadFile`; `onUploaded` gets the verified file. A dropped file of another type is refused here, the
 * backend checks the real type again.
 */
export function UploadZone({
  purpose,
  extensions,
  label,
  hint,
  chooseLabel,
  disabled = false,
  onUploaded,
}: {
  purpose: FileUploadPurpose
  /** Allowed extensions with the dot, lower case: `[".pdf", ".epub"]`. */
  extensions: readonly string[]
  /** What is being uploaded ("Book file"): names the zone for screen readers. */
  label: string
  hint?: string
  chooseLabel: string
  disabled?: boolean
  onUploaded: (file: FileItem) => void
}) {
  const t = useT("library.manage.editor.upload")
  const errorMessage = useErrorMessage()
  const rejectReason = useRejectReason()
  const inputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>({ name: "idle" })
  const [over, setOver] = useState(false)
  const busy = phase.name === "uploading"

  async function upload(file: File) {
    const lower = file.name.toLowerCase()
    if (!extensions.some((extension) => lower.endsWith(extension))) {
      setPhase({ name: "failed", file: file.name, message: t("wrongType", { types: extensions.join(", ") }) })
      return
    }
    setPhase({ name: "uploading", file: file.name, fraction: 0 })
    try {
      const result = await uploadFile(file, purpose, (fraction) =>
        setPhase({ name: "uploading", file: file.name, fraction }),
      )
      if (result.status === "rejected") {
        setPhase({
          name: "failed",
          file: file.name,
          message: t("rejected", { reason: rejectReason(result.reject_reason) }),
        })
        return
      }
      setPhase({ name: "idle" })
      onUploaded(result)
    } catch (error) {
      setPhase({ name: "failed", file: file.name, message: errorMessage(error) })
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setOver(false)
    const file = event.dataTransfer.files[0]
    if (file && !disabled && !busy) void upload(file)
  }

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- a drop target: the Choose button is the keyboard path
    <div
      role="group"
      aria-label={label}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled && !busy) setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border-2 border-dashed p-4 transition-colors",
        over && "border-primary bg-primary/5",
        disabled && "opacity-60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="upload-zone-input"
        accept={extensions.join(",")}
        disabled={disabled || busy}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) void upload(file)
        }}
      />
      <p className="text-muted-foreground text-sm">{hint ?? t("dropHint")}</p>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 md:min-h-8"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        <IconUpload aria-hidden />
        {chooseLabel}
      </Button>
      <div aria-live="polite" className="w-full">
        {phase.name === "uploading" ? (
          <div className="flex flex-col gap-1">
            <span className="truncate text-sm">{t("uploading", { name: phase.file })}</span>
            <Progress value={Math.round(phase.fraction * 100)} aria-label={t("progress", { name: phase.file })} />
          </div>
        ) : null}
        {phase.name === "failed" ? (
          <p role="alert" className="text-destructive text-sm">
            {phase.file}: {phase.message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
