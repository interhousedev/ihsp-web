"use client"

import type { FileItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useImperativeHandle, useRef, type Ref } from "react"
import { FileUploadButton, type FileUploadControl } from "../file-upload-button/file-upload-button"

export type ComposerUploadHandle = {
  /** Opens the file chooser (the "+" menu entry). */
  open: () => void
  /** Uploads files dropped on the composer, with the same progress rows and checks as a chosen file. */
  upload: (files: File[]) => void
}

type ComposerUploadProps = {
  ref: Ref<ComposerUploadHandle>
  disabled: boolean
  onUploaded: (file: FileItem) => void
}

/**
 * The upload machinery of the composer: `FileUploadButton` with its own button hidden. The "+" menu entry opens the
 * file chooser and a drop hands its files over; the progress and error rows stay visible above the pill.
 */
export function ComposerUpload({ ref, disabled, onUploaded }: ComposerUploadProps) {
  const t = useT("assistant.composer")
  const control = useRef<FileUploadControl>(null)

  useImperativeHandle(
    ref,
    () => ({
      open: () => control.current?.open(),
      upload: (files) => control.current?.upload(files),
    }),
    [],
  )

  return (
    <div className="[&>div>button]:hidden">
      <FileUploadButton
        purpose="ai_upload"
        multiple
        iconOnly
        label={t("upload")}
        disabled={disabled}
        onUploaded={onUploaded}
        controlRef={control}
      />
    </div>
  )
}
