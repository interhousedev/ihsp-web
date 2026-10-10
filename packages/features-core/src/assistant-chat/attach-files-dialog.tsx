"use client"

import { getMeFilesQuery, type FileItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

type AttachFilesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Files already attached to the draft. */
  attachedIds: ReadonlySet<string>
  onPick: (files: FileItem[]) => void
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** Pick files from My files for the assistant (AI-7); only ready files with readable text can be chosen. */
export function AttachFilesDialog({ open, onOpenChange, attachedIds, onPick }: AttachFilesDialogProps) {
  const t = useT("assistant.attach")
  const files = useQuery({ ...getMeFilesQuery({ limit: 100 }), enabled: open })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const usable = (files.data?.items ?? []).filter((file) => file.status === "ready")

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function confirm() {
    onPick(usable.filter((file) => selected.has(file.id)))
    setSelected(new Set())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        {files.isPending ? <StateView state="loading" rows={3} /> : null}
        {files.isError ? <StateView state="error" error={files.error} onRetry={() => void files.refetch()} /> : null}
        {files.isSuccess && usable.length === 0 ? <StateView state="empty" emptyText={t("empty")} /> : null}
        {files.isSuccess && usable.length > 0 ? (
          <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {usable.map((file) => {
              const already = attachedIds.has(file.id)
              const blocked = !file.assistant_ready || already
              return (
                <li key={file.id}>
                  <div
                    className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 ${blocked ? "opacity-60" : "hover:bg-muted"}`}
                  >
                    <input
                      id={`attach-${file.id}`}
                      type="checkbox"
                      className="size-5 shrink-0"
                      checked={selected.has(file.id) || already}
                      disabled={blocked}
                      onChange={() => toggle(file.id)}
                    />
                    <label
                      htmlFor={`attach-${file.id}`}
                      className={`flex min-w-0 flex-1 flex-col ${blocked ? "" : "cursor-pointer"}`}
                    >
                      <span className="truncate text-sm font-medium">{file.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatSize(file.byte_size)}
                        {file.assistant_ready ? "" : ` · ${t("notReadable")}`}
                        {already ? ` · ${t("attached")}` : ""}
                      </span>
                    </label>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" className="min-h-11" disabled={selected.size === 0} onClick={confirm}>
            {t("confirm", { count: selected.size })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
