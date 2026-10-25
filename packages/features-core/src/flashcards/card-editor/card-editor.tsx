"use client"

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label, Textarea, buttonVariants, cn } from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"
import type { EditorRow } from "../utils/editor-rows"
import { parseImport } from "../utils/parse-import"
import { DESCRIPTION_MAX, TITLE_MAX } from "../utils/limits"
import { CardEditorRow } from "./card-editor-row"
import { ImportDialog } from "./import-dialog"
import { useCardEditor } from "./use-card-editor"

export type CardEditorValues = {
  title: string
  description: string
  /** The filled rows in their order; `id` is set for cards that already exist (they keep their progress). */
  cards: { id?: string; front: string; back: string }[]
}

export type CardEditorProps = {
  /** `create` is a new set (Create, Create and practice), `edit` changes an existing one (Save, Save and practice). */
  mode: "create" | "edit"
  initialTitle?: string
  initialDescription?: string
  initialRows?: EditorRow[]
  /** Called with the checked values; `practice` is true for "… and practice". */
  onSubmit: (values: CardEditorValues, practice: boolean) => void
  isSubmitting?: boolean
  /** The error of the last submit, shown above the buttons. */
  error?: string | undefined
  /** Where Cancel leads. */
  cancelHref: string
  className?: string
}

/**
 * Quizlet-style editor of a set: title and description, an Import button, numbered rows with Term and Definition,
 * a drag handle (or Alt plus an arrow key) and a delete button per row, "Add a card", and Create / Create and practice.
 * Pasting lines of "term, tab, definition" into a field adds them as cards.
 */
export function CardEditor({
  mode,
  initialTitle = "",
  initialDescription = "",
  initialRows = [],
  onSubmit,
  isSubmitting = false,
  error,
  cancelHref,
  className,
}: CardEditorProps) {
  const t = useT("flashcards.editor")
  const titleId = useId()
  const descriptionId = useId()
  const listRef = useRef<HTMLOListElement>(null)
  const editor = useCardEditor({ title: initialTitle, description: initialDescription, rows: initialRows }, mode)
  const [preview, setPreview] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [announcement, setAnnouncement] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // A page with unsaved work asks before it is closed or reloaded.
  const { dirty } = editor
  useEffect(() => {
    if (!dirty || isSubmitting) return
    const listener = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", listener)
    return () => window.removeEventListener("beforeunload", listener)
  }, [dirty, isSubmitting])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    editor.moveByKey(String(active.id), String(over.id))
  }

  function moveWithKeyboard(index: number, delta: -1 | 1) {
    const target = index + delta
    if (target < 0 || target >= editor.rows.length) return
    const key = editor.rows[index]?.key
    editor.move(index, delta)
    setAnnouncement(t("moved", { n: index + 1, to: target + 1, count: editor.rows.length }))
    // The handle keeps the focus when its row changes place.
    if (key) {
      requestAnimationFrame(() => {
        const handles = listRef.current?.querySelectorAll<HTMLElement>("[data-handle]") ?? []
        Array.from(handles)
          .find((handle) => handle.dataset.handle === key)
          ?.focus()
      })
    }
  }

  function submit(practice: boolean) {
    editor.setShowErrors(true)
    if (!editor.valid || isSubmitting) return
    onSubmit(
      {
        title: editor.title.trim(),
        description: editor.description.trim(),
        cards: editor.rows
          .filter((row) => row.front.trim() !== "" || row.back.trim() !== "")
          .map((row) => ({
            ...(row.id ? { id: row.id } : {}),
            front: row.front.trim(),
            back: row.back.trim(),
          })),
      },
      practice,
    )
  }

  const titleInvalid = editor.showErrors && editor.problems.some((p) => p === "titleRequired" || p === "titleTooLong")
  const problemMessages = editor.showErrors
    ? editor.problems.filter((p) => p !== "titleRequired").map((p) => t(`problems.${p}`))
    : []

  const submitButtons = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link href={cancelHref} className={cn(buttonVariants({ variant: "ghost" }), "min-h-11 rounded-full px-4")}>
        {t("cancel")}
      </Link>
      <Button
        type="button"
        variant="secondary"
        className="min-h-11 rounded-full px-5"
        disabled={isSubmitting}
        onClick={() => submit(false)}
      >
        {isSubmitting ? t("saving") : mode === "create" ? t("create") : t("save")}
      </Button>
      <Button type="button" className="min-h-11 rounded-full px-5" disabled={isSubmitting} onClick={() => submit(true)}>
        {mode === "create" ? t("createAndPractice") : t("saveAndPractice")}
      </Button>
    </div>
  )

  return (
    <form
      className={cn("mx-auto flex w-full max-w-4xl flex-col gap-4", className)}
      noValidate
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {mode === "create" ? t("createTitle") : t("editTitle")}
        </h1>
        <div className="hidden md:block">{submitButtons}</div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={titleId} className="sr-only">
          {t("titleLabel")}
        </Label>
        <Input
          id={titleId}
          value={editor.title}
          maxLength={TITLE_MAX}
          placeholder={t("titleLabel")}
          className="h-12 text-base"
          aria-invalid={titleInvalid}
          onChange={(event) => editor.setTitle(event.target.value)}
        />
        {titleInvalid ? (
          <p role="alert" className="text-destructive text-sm">
            {t("problems.titleRequired")}
          </p>
        ) : null}
        <Label htmlFor={descriptionId} className="sr-only">
          {t("descriptionLabel")}
        </Label>
        <Textarea
          id={descriptionId}
          value={editor.description}
          maxLength={DESCRIPTION_MAX}
          rows={2}
          placeholder={t("descriptionLabel")}
          onChange={(event) => editor.setDescription(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 rounded-full px-4"
          onClick={() => setImportOpen(true)}
        >
          <Icons.upload aria-hidden />
          {t("import")}
        </Button>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-5"
            checked={preview}
            onChange={(event) => setPreview(event.target.checked)}
          />
          {t("preview")}
        </label>
      </div>
      <p className="text-muted-foreground -mt-2 text-xs">{t("hint")}</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          screenReaderInstructions: { draggable: t("dragInstructions") },
          announcements: {
            onDragStart: ({ active }) => t("dragStart", { n: editor.rows.findIndex((r) => r.key === active.id) + 1 }),
            onDragOver: ({ over }) =>
              over ? t("dragOver", { n: editor.rows.findIndex((r) => r.key === over.id) + 1 }) : undefined,
            onDragEnd: ({ over }) =>
              over ? t("dragEnd", { n: editor.rows.findIndex((r) => r.key === over.id) + 1 }) : undefined,
            onDragCancel: () => t("dragCancel"),
          },
        }}
      >
        <SortableContext items={editor.rows.map((row) => row.key)} strategy={verticalListSortingStrategy}>
          <ol ref={listRef} className="flex flex-col gap-3" aria-label={t("cards")}>
            {editor.rows.map((row, index) => (
              <CardEditorRow
                key={row.key}
                row={row}
                index={index}
                invalid={editor.showErrors && (editor.incomplete.has(row.key) || editor.tooLong.has(row.key))}
                preview={preview}
                autoFocus={row.key === editor.focusKey}
                onChange={editor.update}
                onRemove={editor.remove}
                onMove={moveWithKeyboard}
                onPasteCards={(key, text) => editor.importCards(parseImport(text).cards, key)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="flex justify-center py-2">
        <Button
          type="button"
          variant="secondary"
          className="min-h-12 rounded-full px-8 text-base"
          disabled={!editor.canAdd}
          onClick={editor.addRow}
        >
          {t("addCard")}
        </Button>
      </div>

      {problemMessages.length > 0 ? (
        <p role="alert" className="text-destructive text-center text-sm">
          {problemMessages.join(" ")}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-destructive text-center text-sm">
          {error}
        </p>
      ) : null}
      {editor.dirty ? <p className="text-muted-foreground text-end text-xs">{t("unsaved")}</p> : null}
      {submitButtons}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={(cards) => editor.importCards(cards)} />
    </form>
  )
}
