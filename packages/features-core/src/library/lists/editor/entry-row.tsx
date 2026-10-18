"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Importance } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dropdown, Icons, Input, Label, Textarea, cn } from "@ihsp/ui"
import { IconArrowDown, IconArrowUp, IconLink } from "@ihsp/ui"
import { useId, useState, type KeyboardEvent } from "react"
import { SourceTag } from "../../catalog/source-tag"
import { IMPORTANCE_LEVELS, NOTE_MAX, entryProblems, type EditorEntry } from "./entries"

export type EntryRowProps = {
  entry: EditorEntry
  /** 0-based position among the shown entries. */
  index: number
  count: number
  onChange: (key: string, patch: Partial<EditorEntry>) => void
  onMove: (index: number, delta: -1 | 1) => void
  onRemove: (key: string) => void
  /** Show the messages of this entry's problems (after a failed save). */
  showProblems: boolean
}

/**
 * One entry of the list: its place, a drag handle (Alt plus an arrow key also moves it), move up/down and remove
 * buttons, the importance, and the page range, week, due date and note. A plain link also has a title and an address.
 */
export function EntryRow({ entry, index, count, onChange, onMove, onRemove, showProblems }: EntryRowProps) {
  const t = useT("library.listEditor.entry")
  const library = useT("library")
  const ids = {
    importance: useId(),
    title: useId(),
    url: useId(),
    from: useId(),
    to: useId(),
    week: useId(),
    due: useId(),
    note: useId(),
  }
  const n = index + 1
  const name = entry.item ? entry.item.title : entry.title.trim() || t("untitledLink")
  const problems = showProblems ? entryProblems(entry) : []
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.key,
  })
  const [expanded, setExpanded] = useState(() =>
    Boolean(entry.pageFrom || entry.pageTo || entry.weekLabel || entry.dueOn || entry.note),
  )

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault()
      event.stopPropagation()
      onMove(index, event.key === "ArrowUp" ? -1 : 1)
      return
    }
    listeners?.onKeyDown?.(event)
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-entry-key={entry.key}
      aria-label={t("position", { n, count })}
      className={cn(
        "bg-card flex flex-col gap-3 rounded-xl border p-3",
        problems.length > 0 && "border-destructive",
        isDragging && "relative z-10 opacity-80 shadow-lg",
      )}
    >
      <div className="flex flex-wrap items-start gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          onKeyDown={handleKeyDown}
          aria-label={t("reorder", { name })}
          aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
          data-handle={entry.key}
          className="text-muted-foreground hover:bg-muted focus-visible:ring-ring/50 flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-md outline-none focus-visible:ring-3"
        >
          <Icons.gripVertical className="size-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1 basis-40">
          <p className="text-muted-foreground text-xs tabular-nums">{n}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {entry.item ? (
              <>
                <SourceTag source={entry.item.tag.source} />
                <span className="text-muted-foreground text-xs">{library(`type.${entry.item.type}`)}</span>
              </>
            ) : (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <IconLink className="size-3" aria-hidden />
                {t("link")}
              </span>
            )}
          </div>
          <p className="font-medium break-words">{name}</p>
          {entry.item?.author_label ? <p className="text-muted-foreground text-xs">{entry.item.author_label}</p> : null}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={t("up", { name })}
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
          >
            <IconArrowUp aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={t("down", { name })}
            disabled={index === count - 1}
            onClick={() => onMove(index, 1)}
          >
            <IconArrowDown aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive size-11"
            aria-label={t("remove", { name })}
            onClick={() => onRemove(entry.key)}
          >
            <Icons.trash aria-hidden />
          </Button>
        </div>
      </div>

      {entry.item === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.title}>{t("linkTitle")}</Label>
            <Input
              id={ids.title}
              value={entry.title}
              maxLength={200}
              aria-invalid={problems.includes("titleRequired")}
              onChange={(event) => onChange(entry.key, { title: event.target.value })}
            />
            {problems.includes("titleRequired") ? (
              <p role="alert" className="text-destructive text-sm">
                {t("problem.titleRequired")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.url}>{t("linkUrl")}</Label>
            <Input
              id={ids.url}
              type="url"
              inputMode="url"
              value={entry.url}
              placeholder="https://"
              aria-invalid={problems.includes("urlInvalid")}
              onChange={(event) => onChange(entry.key, { url: event.target.value })}
            />
            {problems.includes("urlInvalid") ? (
              <p role="alert" className="text-destructive text-sm">
                {t("problem.urlInvalid")}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor={ids.importance}>{t("importance", { name })}</Label>
        <Dropdown
          id={ids.importance}
          className="w-full"
          value={entry.importance}
          onValueChange={(value) => onChange(entry.key, { importance: value as Importance })}
          options={IMPORTANCE_LEVELS.map((level) => ({ value: level, label: library(`importance.${level}`) }))}
        />
      </div>

      <details
        open={expanded || problems.length > 0}
        onToggle={(event) => setExpanded(event.currentTarget.open)}
        className="group"
      >
        <summary className="text-primary min-h-11 cursor-pointer py-2 text-sm font-medium select-none">
          {t("details")}
        </summary>
        <div className="grid gap-3 pt-1 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.from}>{t("pageFrom", { name })}</Label>
              <Input
                id={ids.from}
                type="number"
                min={1}
                inputMode="numeric"
                value={entry.pageFrom}
                aria-invalid={problems.includes("pagesInvalid")}
                onChange={(event) => onChange(entry.key, { pageFrom: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.to}>{t("pageTo", { name })}</Label>
              <Input
                id={ids.to}
                type="number"
                min={1}
                inputMode="numeric"
                value={entry.pageTo}
                aria-invalid={problems.includes("pagesInvalid")}
                onChange={(event) => onChange(entry.key, { pageTo: event.target.value })}
              />
            </div>
            {problems.includes("pagesInvalid") ? (
              <p role="alert" className="text-destructive col-span-2 text-sm">
                {t("problem.pagesInvalid")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.week}>{t("week", { name })}</Label>
            <Input
              id={ids.week}
              value={entry.weekLabel}
              maxLength={40}
              placeholder={t("weekPlaceholder")}
              onChange={(event) => onChange(entry.key, { weekLabel: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.due}>{t("due", { name })}</Label>
            <Input
              id={ids.due}
              type="date"
              value={entry.dueOn}
              onChange={(event) => onChange(entry.key, { dueOn: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={ids.note}>{t("note", { name })}</Label>
            <Textarea
              id={ids.note}
              value={entry.note}
              rows={2}
              maxLength={NOTE_MAX}
              onChange={(event) => onChange(entry.key, { note: event.target.value })}
            />
            <p className="text-muted-foreground text-xs">
              {t("noteHint", { count: entry.note.length, max: NOTE_MAX })}
            </p>
          </div>
        </div>
      </details>
    </li>
  )
}
