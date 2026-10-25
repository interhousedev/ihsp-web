"use client"

import { uploadFile, type FileItem } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { IconLoader2, IconPhoto } from "@ihsp/ui"
import { type ChangeEvent, useRef, useState } from "react"
import { ToolbarButton } from "./toolbar-button"

const IMAGE_ACCEPT = "image/png,image/jpeg"

/** Toolbar button that uploads an image through the files module and hands the stored file to `onUploaded`. */
export function ImageUploadButton({
  disabled,
  onUploaded,
  onError,
}: {
  disabled?: boolean
  onUploaded: (file: FileItem) => void
  onError: (message: string) => void
}) {
  const t = useT("markdownEditor")
  const errorMessage = useErrorMessage()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setBusy(true)
    try {
      const result = await uploadFile(file, "link")
      if (result.status === "rejected") onError(t("imageRejected"))
      else onUploaded(result)
    } catch (caught) {
      onError(errorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ToolbarButton
        label={t("image")}
        icon={busy ? IconLoader2 : IconPhoto}
        disabled={disabled || busy}
        onPress={() => input.current?.click()}
      />
      <input
        ref={input}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        tabIndex={-1}
        aria-label={t("imageFile")}
        onChange={(event) => void onChange(event)}
      />
    </>
  )
}
