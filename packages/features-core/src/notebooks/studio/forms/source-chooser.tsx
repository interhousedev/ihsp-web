"use client"

import type { SourceItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Input, StateView } from "@ihsp/ui"
import { IconPlus } from "@ihsp/ui"
import { useId, useState } from "react"
import { SourceKindIcon } from "../../lib/source-icons"
import { isUsable } from "../../lib/sort-sources"
import { PickRow } from "../../sources/pick-row"

export type SourceChooserProps = {
  /** Every source of the notebook; `undefined` while the list loads. */
  sources: readonly SourceItem[] | undefined
  loading: boolean
  error: unknown
  onRetry: () => void
  /** Ids ticked in the dialog. */
  selected: ReadonlySet<string>
  onChange: (next: Set<string>) => void
  /** Opens the file picker. */
  onAdd: () => void
  adding: boolean
}

/** A source that is still being read can be ticked (it is skipped if not ready in time); a broken one cannot. */
export function isTickable(source: SourceItem): boolean {
  if (source.ai_unsupported) return false
  return isUsable(source) || source.status === "pending" || source.status === "processing"
}

/** The ids ticked by default: what is selected in the Sources pane. */
export function defaultSelection(sources: readonly SourceItem[] | undefined): Set<string> {
  return new Set((sources ?? []).filter((source) => isUsable(source) && source.selected).map((source) => source.id))
}

/**
 * The Sources part of a Customize dialog: search, a tickable list with select all / none, the count and an
 * "Add sources" button. The selection lives in the dialog; the Sources pane is not changed.
 */
export function SourceChooser({
  sources,
  loading,
  error,
  onRetry,
  selected,
  onChange,
  onAdd,
  adding,
}: SourceChooserProps) {
  const t = useT("notebooks")
  const headingId = useId()
  const [search, setSearch] = useState("")

  const all = sources ?? []
  const needle = search.trim().toLowerCase()
  const shown = needle === "" ? all : all.filter((source) => source.title.toLowerCase().includes(needle))
  const tickable = shown.filter(isTickable)
  const selectedCount = all.filter((source) => selected.has(source.id)).length

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }
  const selectShown = (on: boolean) => {
    const next = new Set(selected)
    for (const source of tickable) {
      if (on) next.add(source.id)
      else next.delete(source.id)
    }
    onChange(next)
  }

  const note = (source: SourceItem): string | undefined => {
    if (source.ai_unsupported) return t("status.aiUnsupported")
    switch (source.status) {
      case "pending":
      case "processing":
        return t(`status.${source.status}`)
      case "failed":
        return t("status.failed")
      case "unavailable":
        return t("status.unavailable")
      case "stale":
        return t("status.stale")
      default:
        return undefined
    }
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-medium">
          {t("studio.sources.title")}
          <span className="text-muted-foreground ms-2 font-normal" role="status">
            {t("studio.sources.count", { selected: selectedCount, total: all.length })}
          </span>
        </h3>
        <Button type="button" variant="outline" className="min-h-11 md:min-h-8" disabled={adding} onClick={onAdd}>
          <IconPlus aria-hidden />
          {t("studio.sources.add")}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={search}
          aria-label={t("studio.sources.search")}
          placeholder={t("studio.sources.search")}
          className="h-11 min-w-40 flex-1 md:h-8"
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button
          type="button"
          variant="link"
          className="min-h-11 px-1 md:min-h-8"
          disabled={tickable.length === 0}
          onClick={() => selectShown(true)}
        >
          {t("studio.sources.all")}
        </Button>
        <Button
          type="button"
          variant="link"
          className="min-h-11 px-1 md:min-h-8"
          disabled={selectedCount === 0}
          onClick={() => selectShown(false)}
        >
          {t("studio.sources.none")}
        </Button>
      </div>
      {loading ? <StateView state="loading" rows={2} /> : null}
      {error ? <StateView state="error" error={error} onRetry={onRetry} /> : null}
      {!loading && !error && all.length === 0 ? (
        <StateView state="empty" emptyText={t("studio.sources.empty")} />
      ) : null}
      {all.length > 0 && shown.length === 0 ? (
        <StateView state="empty" emptyText={t("studio.sources.noMatch")} />
      ) : null}
      {shown.length > 0 ? (
        <ul aria-label={t("studio.sources.list")} className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pe-1">
          {shown.map((source) => (
            <PickRow
              key={source.id}
              label={source.title}
              meta={source.word_count > 0 ? t("studio.sources.words", { count: source.word_count }) : undefined}
              note={note(source)}
              icon={<SourceKindIcon kind={source.kind} title={source.title} />}
              checked={selected.has(source.id)}
              disabled={!isTickable(source)}
              onToggle={() => toggle(source.id)}
            />
          ))}
        </ul>
      ) : null}
    </section>
  )
}
