"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, PageContainer, StateView } from "@ihsp/ui"
import { IconDeviceFloppy, IconPlus } from "@tabler/icons-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useFlashcardSet, useSaveFlashcardCards } from "../hooks/use-flashcards"
import {
  incompleteRowKeys,
  moveRow,
  newEditorRow,
  rowsEqual,
  rowsFromSet,
  toCardsBody,
  type EditorRow,
} from "../utils/editor-rows"
import { CardEditorRow } from "./card-editor-row"

/** `/flashcards/edit/?id=`: add, edit, reorder and delete cards; Save sends the full ordered list (WEB-24). */
export function CardEditor() {
  const t = useT("flashcards.editor")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const id = useSearchParams().get("id")
  const set = useFlashcardSet(id)
  const save = useSaveFlashcardCards(id ?? "")
  const [rows, setRows] = useState<EditorRow[]>([])
  const [saved, setSaved] = useState<EditorRow[]>([])
  const [preview, setPreview] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  // Load the cards once per set; later refetches must not overwrite what the student is typing.
  useEffect(() => {
    if (set.data && loadedId !== set.data.id) {
      const initial = rowsFromSet(set.data)
      setRows(initial)
      setSaved(initial)
      setLoadedId(set.data.id)
    }
  }, [set.data, loadedId])

  if (id === null) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="empty" emptyText={t("missing")} />
      </PageContainer>
    )
  }
  if (set.isPending || (set.isSuccess && loadedId !== set.data.id)) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="loading" rows={3} />
      </PageContainer>
    )
  }
  if (set.isError) {
    return (
      <PageContainer title={t("title")}>
        <StateView state="error" error={set.error} onRetry={() => void set.refetch()} />
      </PageContainer>
    )
  }

  const dirty = !rowsEqual(rows, saved)
  const incomplete = incompleteRowKeys(rows)
  const setQuery = `?id=${encodeURIComponent(id)}`

  function update(key: string, patch: Partial<Pick<EditorRow, "front" | "back">>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function submit() {
    if (incomplete.size > 0) {
      setShowErrors(true)
      return
    }
    save.mutate(toCardsBody(rows), {
      onSuccess: () => {
        toast.success(t("saved"))
        router.push(`/flashcards/set/${setQuery}`)
      },
    })
  }

  const actions = (
    <>
      <Link
        href={`/flashcards/set/${setQuery}`}
        className="hover:bg-muted inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium"
      >
        {dirty ? t("discard") : t("backToSet")}
      </Link>
      <Button type="button" className="min-h-11" disabled={!dirty || save.isPending} onClick={submit}>
        <IconDeviceFloppy aria-hidden />
        {save.isPending ? t("saving") : t("save")}
      </Button>
    </>
  )

  return (
    <PageContainer title={t("titleFor", { title: set.data.title })} description={t("hint")} actions={actions}>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-5"
          checked={preview}
          onChange={(event) => setPreview(event.target.checked)}
        />
        {t("preview")}
      </label>
      {rows.length === 0 ? <StateView state="empty" emptyText={t("empty")} /> : null}
      <ol className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <CardEditorRow
            key={row.key}
            row={row}
            index={index}
            count={rows.length}
            invalid={showErrors && incomplete.has(row.key)}
            preview={preview}
            onChange={update}
            onMove={(from, delta) => setRows((current) => moveRow(current, from, delta))}
            onRemove={(key) => setRows((current) => current.filter((item) => item.key !== key))}
          />
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => setRows((current) => [...current, newEditorRow()])}
        >
          <IconPlus aria-hidden />
          {t("add")}
        </Button>
        {dirty ? <span className="text-muted-foreground text-sm">{t("unsaved")}</span> : null}
      </div>
      {save.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(save.error)}
        </p>
      ) : null}
    </PageContainer>
  )
}
