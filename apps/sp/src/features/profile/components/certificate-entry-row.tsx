"use client"

import {
  ApiError,
  deleteMyCertificate,
  deleteMyCertificateFile,
  getCertificateFileBlob,
  keys,
  postMyCertificateFile,
  type CertificateEntry,
  type CertificateFile,
} from "@ihsp/api"
import { entrySummary, saveBlob } from "@ihsp/features-core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button, ConfirmDialog, IconDownload, IconPencil, IconPlus, IconTrash } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { formatBytes } from "../../shared/utils/format-bytes"

const ACCEPT = ".png,.jpg,.jpeg,.pdf,.docx"

type Pending = { kind: "entry" } | { kind: "file"; file: CertificateFile } | null

/** One entry with its files: upload several files, download, delete a file or the entry (both ask first). */
export function CertificateEntryRow({ entry, onEdit }: { entry: CertificateEntry; onEdit: () => void }) {
  const t = useT("certificates")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending>(null)
  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.certificates.mine() })
  const uploadError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 413) return t("errors.tooBig")
    if (error instanceof ApiError && error.status === 415) return t("errors.badType")
    return errorMessage(error)
  }

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) await postMyCertificateFile(entry.id, file)
    },
    onSuccess: async () => {
      toast.success(t("uploaded"))
      await refresh()
    },
    onError: async (error) => {
      toast.error(uploadError(error))
      await refresh()
    },
  })
  const removeFile = useMutation({
    mutationFn: (file: CertificateFile) => deleteMyCertificateFile(entry.id, file.id),
    onSuccess: async () => {
      await refresh()
      setPending(null)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const removeEntry = useMutation({
    mutationFn: () => deleteMyCertificate(entry.id),
    onSuccess: async () => {
      await refresh()
      setPending(null)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const download = useMutation({
    mutationFn: async (file: CertificateFile) => saveBlob(await getCertificateFileBlob(file.id), file.name),
    onError: (error) => toast.error(errorMessage(error)),
  })

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="font-medium">{entrySummary(entry) || "—"}</span>
          {entry.source === "emis" ? <Badge variant="secondary">{t("sourceEmis")}</Badge> : null}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            aria-label={t("edit")}
            onClick={onEdit}
          >
            <IconPencil aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            aria-label={t("deleteEntry")}
            onClick={() => setPending({ kind: "entry" })}
          >
            <IconTrash aria-hidden />
          </Button>
        </div>
      </div>
      <ul className="flex flex-col gap-1">
        {entry.files.map((file) => (
          <li key={file.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">
              {file.name} <span className="text-muted-foreground">{formatBytes(file.size)}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 md:size-8"
                aria-label={`${t("download")}: ${file.name}`}
                onClick={() => download.mutate(file)}
              >
                <IconDownload aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 md:size-8"
                aria-label={t("deleteFile", { name: file.name })}
                onClick={() => setPending({ kind: "file", file })}
              >
                <IconTrash aria-hidden />
              </Button>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={ACCEPT}
          aria-label={t("addFiles")}
          data-testid={`cert-files-${entry.id}`}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            event.target.value = ""
            if (files.length > 0) upload.mutate(files)
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 md:min-h-8"
          disabled={upload.isPending}
          onClick={() => input.current?.click()}
        >
          <IconPlus aria-hidden /> {upload.isPending ? t("uploading") : t("addFiles")}
        </Button>
        <span className="text-muted-foreground text-xs">{t("fileHint")}</span>
      </div>
      {pending?.kind === "file" ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (open ? undefined : setPending(null))}
          title={t("deleteFileTitle")}
          description={t("deleteFileText", { name: pending.file.name })}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          destructive
          loading={removeFile.isPending}
          onConfirm={() => removeFile.mutate(pending.file)}
        />
      ) : null}
      {pending?.kind === "entry" ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (open ? undefined : setPending(null))}
          title={t("deleteEntryTitle")}
          description={t("deleteEntryText")}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          destructive
          loading={removeEntry.isPending}
          onConfirm={() => removeEntry.mutate()}
        />
      ) : null}
    </li>
  )
}
