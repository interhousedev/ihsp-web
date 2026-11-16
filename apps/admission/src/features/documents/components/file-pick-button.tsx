"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useRef, type ComponentProps } from "react"
import { toast } from "sonner"
import { useAdmissionConfig } from "../../../lib/config"

const MB = 1024 * 1024

/** The upload rules the backend publishes in `GET /v1/admission/config`; empty until it has loaded. */
export function useUploadRules(): { maxBytes: number | null; mime: string[] } {
  const config = useAdmissionConfig().data as
    | { limits?: Record<string, number>; options?: Record<string, string[]> }
    | undefined
  return { maxBytes: config?.limits?.upload_max_bytes ?? null, mime: config?.options?.upload_mime ?? [] }
}

const formatOf = (mime: string) => mime.split("/")[1]?.toUpperCase() ?? mime

/** What may be uploaded, plus the warning that files are not virus-scanned. */
export function UploadHint() {
  const t = useT("documents")
  const { maxBytes, mime } = useUploadRules()
  if (maxBytes === null || mime.length === 0) return null
  return (
    <p className="text-muted-foreground text-xs">
      {t("uploadRules", { formats: mime.map(formatOf).join(", "), size: Math.round(maxBytes / MB) })}{" "}
      {t("unscannedWarning")}
    </p>
  )
}

/** A button that opens the file dialog and hands the chosen file over. */
export function FilePickButton({
  label,
  onPick,
  disabled,
  variant = "outline",
  size,
}: {
  label: string
  onPick: (file: File) => void
  disabled?: boolean
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
}) {
  const t = useT("documents")
  const { maxBytes, mime } = useUploadRules()
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={input}
        type="file"
        hidden
        accept={mime.length ? mime.join(",") : undefined}
        data-testid="file-input"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (!file) return
          if (maxBytes !== null && file.size > maxBytes) {
            toast.error(t("tooLarge", { size: Math.round(maxBytes / MB) }))
          } else if (mime.length && !mime.includes(file.type)) {
            toast.error(t("wrongType", { formats: mime.map(formatOf).join(", ") }))
          } else onPick(file)
        }}
      />
      <Button type="button" variant={variant} size={size} disabled={disabled} onClick={() => input.current?.click()}>
        <Icons.upload data-icon="inline-start" aria-hidden />
        {label}
      </Button>
    </>
  )
}
