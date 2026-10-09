"use client"

import type { SourceDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Input, Label, Textarea } from "@ihsp/ui"
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react"
import { useId, useState } from "react"
import { useAddSources, useUpdateSource } from "../api"
import { CitedMarkdown } from "../chat"
import { stripCitations } from "../lib/citations"
import { useNotebookErrorMessage } from "../lib/use-notebook-error"
import { useWorkspace } from "../workspace-context"

const MAX_TITLE_LENGTH = 200

type NoteFormProps = {
  notebookId: string
  /** The note or pasted text being edited; null writes a new note. */
  source: SourceDetail | null
  onClose: () => void
}

/** Title + Markdown body with Save note; a note with citations is read-only until the citations are removed. */
export function NoteForm({ notebookId, source, onClose }: NoteFormProps) {
  const t = useT("notebooks")
  const { openSource } = useWorkspace()
  const errorMessage = useNotebookErrorMessage()
  const titleId = useId()
  const bodyId = useId()
  const add = useAddSources(notebookId)
  const update = useUpdateSource(notebookId)
  const [title, setTitle] = useState(source?.title ?? "")
  const [body, setBody] = useState(source?.body_md ?? "")
  const [citationsRemoved, setCitationsRemoved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cited = source !== null && source.citations.length > 0 && !citationsRemoved
  const pending = add.isPending || update.isPending
  const canSave =
    !pending && (cited ? title.trim() !== "" : body.trim() !== "" && (source === null || title.trim() !== ""))

  async function save() {
    setError(null)
    try {
      if (source === null) {
        const result = await add.mutateAsync([
          { kind: "note", title: title.trim() || t("note.untitled"), body_md: body.trim() },
        ])
        const rejected = result.rejected[0]
        if (rejected) setError(errorMessage(rejected.error))
        else onClose()
        return
      }
      await update.mutateAsync({
        id: source.id,
        body: cited ? { title: title.trim() } : { title: title.trim(), body_md: body.trim() },
      })
      openSource(source.id)
    } catch (failure) {
      setError(errorMessage(failure))
    }
  }

  return (
    <form
      aria-label={source ? source.title : t("note.new")}
      className="flex h-full min-h-0 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSave) void save()
      }}
    >
      <header className="flex shrink-0 items-center gap-2 border-b px-2 py-1 md:px-3">
        <Button type="button" variant="ghost" className="min-h-11 shrink-0 gap-1 px-2 md:min-h-8" onClick={onClose}>
          <IconArrowLeft aria-hidden />
          <span className="sr-only sm:not-sr-only">{t("viewer.back")}</span>
        </Button>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{source ? source.title : t("note.new")}</h2>
        <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onClose}>
          {t("note.cancel")}
        </Button>
        <Button type="submit" className="min-h-11 md:min-h-8" disabled={!canSave}>
          {pending ? <IconLoader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : null}
          {t("note.save")}
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor={titleId}>{t("note.titleLabel")}</Label>
            <Input
              id={titleId}
              value={title}
              maxLength={MAX_TITLE_LENGTH}
              placeholder={t("note.untitled")}
              className="h-11 md:h-8"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          {cited && source ? (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-xs">{t("note.citedHint")}</p>
              <div className="bg-muted/40 rounded-lg border p-4">
                <CitedMarkdown text={source.body_md ?? ""} citations={source.citations} />
              </div>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 self-start"
                onClick={() => {
                  setBody(stripCitations(source.body_md ?? ""))
                  setCitationsRemoved(true)
                }}
              >
                {t("note.removeCitations")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Label htmlFor={bodyId}>{t("note.body")}</Label>
              <Textarea
                id={bodyId}
                value={body}
                placeholder={t("note.placeholder")}
                className="min-h-72"
                onChange={(event) => setBody(event.target.value)}
              />
              <p className="text-muted-foreground text-xs">{t("note.markdownHint")}</p>
            </div>
          )}
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  )
}
