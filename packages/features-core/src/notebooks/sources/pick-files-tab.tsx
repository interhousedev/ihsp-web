"use client"

import { getMeFilesQuery, type FileItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Input, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { DrivePicker, FileUploadButton } from "../../file-upload-button"
import { SourceKindIcon } from "../lib/source-icons"
import type { FilesTabProps } from "./add-types"
import { PickRow } from "./pick-row"
import { refValue } from "./source-rules"
import { UploadDropZone } from "./upload-drop-zone"
import { useFormatBytes } from "./use-format-bytes"

/** Files with readable text can be sources; the rest are shown disabled with the reason. */
function hasReadableText(file: FileItem): boolean {
  return file.assistant_ready && file.text_bytes !== null
}

/** The "My files" tab: a searchable list of ready files, an upload button and a drop zone. */
export function PickFilesTab({ sources, selection, full, uploader }: FilesTabProps) {
  const t = useT("notebooks")
  const format = useFormatters()
  const formatBytes = useFormatBytes()
  const files = useQuery(getMeFilesQuery({ limit: 100 }))
  const [search, setSearch] = useState("")
  const [browsing, setBrowsing] = useState(false)

  const added = new Set(sources.filter((source) => source.kind === "file").map((source) => refValue(source, "file_id")))
  const ready = (files.data?.items ?? []).filter((file) => file.status === "ready")
  const needle = search.trim().toLowerCase()
  const shown = ready.filter((file) => needle === "" || file.name.toLowerCase().includes(needle))

  return (
    <UploadDropZone
      uploader={uploader}
      rows="top"
      className="flex min-h-0 flex-1 rounded-lg border border-dashed border-transparent p-1"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="search"
          value={search}
          aria-label={t("add.files.search")}
          placeholder={t("add.files.search")}
          className="h-11 flex-1 md:h-8"
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={() => setBrowsing(true)}>
          {t("add.files.browse")}
        </Button>
        <FileUploadButton
          purpose="ai_upload"
          multiple
          label={t("add.upload")}
          onUploaded={(file) => void uploader.addFile(file)}
        />
      </div>
      <DrivePicker
        open={browsing}
        onOpenChange={setBrowsing}
        multiple
        uploadPurpose="ai_upload"
        onSelect={(picked) => {
          for (const file of picked) {
            const key = `file:${file.id}`
            if (added.has(file.id) || selection.has(key) || !hasReadableText(file)) continue
            selection.toggle({ key, input: { kind: "file", file_id: file.id }, label: file.name })
          }
          setBrowsing(false)
        }}
      />
      <p className="text-muted-foreground text-xs">{t("add.drop")}</p>
      {files.isPending ? <StateView state="loading" rows={3} /> : null}
      {files.isError ? <StateView state="error" error={files.error} onRetry={() => void files.refetch()} /> : null}
      {files.isSuccess && ready.length === 0 ? <StateView state="empty" emptyText={t("add.files.empty")} /> : null}
      {files.isSuccess && ready.length > 0 && shown.length === 0 ? (
        <StateView state="empty" emptyText={t("add.files.noMatch")} />
      ) : null}
      {shown.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {shown.map((file) => {
            const key = `file:${file.id}`
            const already = added.has(file.id)
            const readable = hasReadableText(file)
            const checked = already || selection.has(key)
            return (
              <PickRow
                key={file.id}
                label={file.name}
                meta={`${formatBytes(file.byte_size)} · ${format.date(file.created_at)}`}
                note={already ? t("add.alreadyAdded") : readable ? undefined : t("add.noText")}
                icon={<SourceKindIcon kind="file" title={file.name} />}
                checked={checked}
                disabled={already || !readable || (full && !checked)}
                onToggle={() => selection.toggle({ key, input: { kind: "file", file_id: file.id }, label: file.name })}
              />
            )
          })}
        </ul>
      ) : null}
    </UploadDropZone>
  )
}
