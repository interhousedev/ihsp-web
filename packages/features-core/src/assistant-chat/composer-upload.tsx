"use client"

import type { FileItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useImperativeHandle, useRef, type Ref } from "react"
import { FileUploadButton } from "../file-upload-button"

export type ComposerUploadHandle = { open: () => void }

type ComposerUploadProps = {
  ref: Ref<ComposerUploadHandle>
  disabled: boolean
  onUploaded: (file: FileItem) => void
}

/**
 * The upload machinery of the composer: `FileUploadButton` with its own button hidden, so the "+" menu entry
 * **Upload a file** can open the file chooser while the progress and error rows stay visible above the pill.
 */
export function ComposerUpload({ ref, disabled, onUploaded }: ComposerUploadProps) {
  const t = useT("assistant.composer")
  const wrapper = useRef<HTMLDivElement>(null)

  useImperativeHandle(
    ref,
    () => ({
      open: () => wrapper.current?.querySelector<HTMLInputElement>('input[type="file"]')?.click(),
    }),
    [],
  )

  return (
    <div ref={wrapper} className="[&>div>button]:hidden">
      <FileUploadButton
        purpose="ai_upload"
        multiple
        iconOnly
        label={t("upload")}
        disabled={disabled}
        onUploaded={onUploaded}
      />
    </div>
  )
}
