"use client"

import { getFileQuery, resolveFileUrl, type FileItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconFile, IconX } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

type FileChipProps = {
  /** Known file; otherwise it is loaded by `fileId`. */
  file?: FileItem
  fileId?: string
  onRemove?: () => void
}

/** A file attached to a message or to the draft; opens the file when clicked. */
export function FileChip({ file, fileId, onRemove }: FileChipProps) {
  const t = useT("assistant.files")
  const id = file?.id ?? fileId ?? ""
  const loaded = useQuery({ ...getFileQuery(id), enabled: !file && id !== "" })
  const name = file?.name ?? loaded.data?.name ?? t("unnamed")

  async function open() {
    try {
      window.open(await resolveFileUrl(id, true), "_blank", "noopener,noreferrer")
    } catch {
      toast.error(t("openFailed"))
    }
  }

  return (
    <span className="bg-muted inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 pr-1 pl-2 text-xs">
      <IconFile className="size-3.5 shrink-0" aria-hidden />
      <button
        type="button"
        className="min-h-6 min-w-0 truncate text-left underline-offset-2 hover:underline"
        onClick={() => void open()}
      >
        {name}
      </button>
      {onRemove ? (
        <button
          type="button"
          className="hover:bg-background inline-flex size-6 items-center justify-center rounded-full"
          aria-label={t("remove", { name })}
          onClick={onRemove}
        >
          <IconX className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </span>
  )
}
