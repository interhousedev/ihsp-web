"use client"

import { keys, getNotebookSourcesQuery, type FileItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Label, ResponsiveDialog, Textarea } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { FilePicker, FileUploadButton } from "../../file-upload-button"
import { useNotebooks } from "../../notebooks/api"
import { isUsable } from "../../notebooks/lib/sort-sources"
import { useNotebookErrorMessage } from "../../notebooks/lib/use-notebook-error"
import type { ImportedCard } from "../utils/parse-import"
import { useAiCards, type AiCardsRequest } from "./use-ai-cards"

const COUNTS: readonly AiCardsRequest["count"][] = ["fewer", "standard", "more"]
const MAX_SOURCES = 20

type PickedSource = { notebook_id: string; source_id: string }

function NotebookSources({
  notebookId,
  picked,
  onToggle,
}: {
  notebookId: string
  picked: readonly PickedSource[]
  onToggle: (source: PickedSource) => void
}) {
  const query = useQuery(getNotebookSourcesQuery(notebookId))
  return (
    <ul className="flex flex-col gap-1 pl-4">
      {(query.data ?? []).filter(isUsable).map((source) => (
        <li key={source.id}>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-5"
              checked={picked.some((item) => item.source_id === source.id)}
              onChange={() => onToggle({ notebook_id: notebookId, source_id: source.id })}
            />
            <span className="min-w-0 truncate">{source.title}</span>
          </label>
        </li>
      ))}
    </ul>
  )
}

export type AiCardsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The cards kept in the preview; the editor adds them after the existing ones. */
  onAdd: (cards: ImportedCard[]) => void
}

/** "Add new questions with AI": choose notebook sources and files, or upload, then preview the generated cards. */
export function AiCardsDialog({ open, onOpenChange, onAdd }: AiCardsDialogProps) {
  const t = useT("flashcards.aiCards")
  const promptId = useId()
  const notebookError = useNotebookErrorMessage()
  const queryClient = useQueryClient()
  const ai = useAiCards()
  const notebooks = useNotebooks(undefined, open)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sources, setSources] = useState<PickedSource[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [count, setCount] = useState<AiCardsRequest["count"]>("standard")
  const [prompt, setPrompt] = useState("")
  const [dropped, setDropped] = useState<ReadonlySet<number>>(new Set())

  const total = sources.length + files.length
  const full = total >= MAX_SOURCES
  const kept = ai.cards.filter((_, index) => !dropped.has(index))
  const busy = ai.phase === "reading" || ai.phase === "generating"

  function close() {
    ai.reset()
    setSources([])
    setFiles([])
    setPrompt("")
    setDropped(new Set())
    onOpenChange(false)
  }

  function toggleSource(source: PickedSource) {
    setSources((current) =>
      current.some((item) => item.source_id === source.source_id)
        ? current.filter((item) => item.source_id !== source.source_id)
        : full
          ? current
          : [...current, source],
    )
  }

  function addFile(file: FileItem) {
    setFiles((current) => (current.some((item) => item.id === file.id) || full ? current : [...current, file]))
  }

  function toggleCard(index: number) {
    setDropped((current) => {
      const next = new Set(current)
      if (!next.delete(index)) next.add(index)
      return next
    })
  }

  function confirm() {
    if (kept.length === 0) return
    onAdd(kept)
    close()
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={t("title")}
      footer={
        <>
          <Button type="button" variant="ghost" className="min-h-11" onClick={close}>
            {t("cancel")}
          </Button>
          {ai.phase === "preview" ? (
            <Button type="button" className="min-h-11" disabled={kept.length === 0} onClick={confirm}>
              {t("add", { count: kept.length })}
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-11"
              disabled={total === 0 || busy}
              onClick={() =>
                void ai.start({ notebookSources: sources, fileIds: files.map((file) => file.id), count, prompt })
              }
            >
              {t("generate")}
            </Button>
          )}
        </>
      }
    >
      {ai.phase === "preview" ? (
        <ul aria-label={t("generated")} className="flex flex-col gap-2">
          {ai.cards.map((card, index) => (
            <li key={index}>
              <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-5 shrink-0"
                  checked={!dropped.has(index)}
                  onChange={() => toggleCard(index)}
                />
                <span className="min-w-0 break-words">
                  <span className="block font-medium">{card.front}</span>
                  <span className="block text-muted-foreground">{card.back}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : busy ? (
        <p role="status" className="py-8 text-center text-sm text-muted-foreground">
          {t(ai.phase === "reading" ? "reading" : "generating")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">{t("notebooks")}</h3>
            {(notebooks.data?.items ?? []).map((notebook) => (
              <div key={notebook.id}>
                <Button
                  type="button"
                  variant="ghost"
                  aria-expanded={expanded === notebook.id}
                  className="min-h-11 w-full justify-start"
                  onClick={() => setExpanded(expanded === notebook.id ? null : notebook.id)}
                >
                  <span className="truncate">{notebook.title}</span>
                </Button>
                {expanded === notebook.id ? (
                  <NotebookSources notebookId={notebook.id} picked={sources} onToggle={toggleSource} />
                ) : null}
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("files")}</h3>
            <FileUploadButton
              purpose="ai_upload"
              multiple
              disabled={full}
              label={t("upload")}
              className="min-h-11"
              onUploaded={addFile}
              onSettled={() => void queryClient.invalidateQueries({ queryKey: keys.me.files() })}
            />
            <FilePicker onPick={addFile} disabled={full} enabled={open} />
          </section>

          <p className="text-sm text-muted-foreground">{t("chosen", { count: total, max: MAX_SOURCES })}</p>
          {files.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {files.map((file) => (
                <li key={file.id}>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11 max-w-full rounded-full"
                    aria-label={t("removeFile", { name: file.name })}
                    onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))}
                  >
                    <span className="truncate">{file.name}</span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          <div role="group" aria-label={t("count")} className="flex flex-wrap gap-2">
            {COUNTS.map((option) => (
              <Button
                key={option}
                type="button"
                variant={count === option ? "default" : "outline"}
                aria-pressed={count === option}
                className="min-h-11 rounded-full"
                onClick={() => setCount(option)}
              >
                {t(`counts.${option}`)}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor={promptId}>{t("focus")}</Label>
            <Textarea
              id={promptId}
              maxLength={1000}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </div>

          {ai.phase === "failed" ? (
            <p role="alert" className="text-sm text-destructive">
              {ai.error ? notebookError(ai.error) : t("failed")}
            </p>
          ) : null}
        </div>
      )}
    </ResponsiveDialog>
  )
}
