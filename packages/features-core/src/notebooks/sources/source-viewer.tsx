"use client"

import { useT } from "@ihsp/i18n"
import { Button, Skeleton, StateView, cn } from "@ihsp/ui"
import { IconArrowLeft, IconPencil, IconQuote } from "@ihsp/ui"
import { useEffect, useId, useRef } from "react"
import { SourceKindIcon } from "../lib/source-icons"
import { useWorkspace } from "../workspace-context"
import { PassageList } from "./passage-list"
import { SelectionToolbar } from "./selection-toolbar"
import { SourceActionDialogs } from "./source-action-dialogs"
import { SourceActionsMenu } from "./source-actions-menu"
import { SourceBanner } from "./source-banner"
import { SourceGuide } from "./source-guide"
import { useSourceActions } from "./use-source-actions"
import { useSourceDetail } from "./use-source-detail"
import { useTextSelection } from "./use-text-selection"

export type SourceViewerProps = {
  notebookId: string
  sourceId: string
  /** Scroll to this passage and highlight it (opened from a citation). */
  passageId?: string | null
}

/**
 * The source viewer (middle pane, a full screen on phones): top bar, the source guide and the text in passages.
 * Opened from a citation it scrolls to the cited passage and highlights it. Selecting text offers "Ask about this".
 */
export function SourceViewer({ notebookId, sourceId, passageId }: SourceViewerProps) {
  const t = useT("notebooks")
  const { closeViewer, ask, openNoteEditor } = useWorkspace()
  const detail = useSourceDetail(notebookId, sourceId)
  const actions = useSourceActions(notebookId, { onRemoved: closeViewer })
  const textRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const headingId = useId()
  const { selected, clear } = useTextSelection(textRef)
  const source = detail.data

  // The viewer replaces the chat: move focus to its heading so keyboard and screen reader users start here.
  useEffect(() => {
    if (sourceId) headingRef.current?.focus({ preventScroll: true })
  }, [sourceId])

  function askAboutSelection() {
    if (!selected) return
    ask({ text: selected.text, anchor: { kind: "text", text: selected.text } })
    clear()
  }

  const readable = source?.status === "ready" || source?.status === "stale"

  return (
    <section aria-labelledby={headingId} className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-1 border-b px-2 py-1 md:px-3">
        <Button type="button" variant="ghost" className="min-h-11 shrink-0 gap-1 px-2 md:min-h-8" onClick={closeViewer}>
          <IconArrowLeft aria-hidden />
          <span className="sr-only sm:not-sr-only">{t("viewer.back")}</span>
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {source ? <SourceKindIcon kind={source.kind} title={source.title} /> : null}
          <h2
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className={cn("truncate text-sm font-semibold outline-hidden", !source && "text-muted-foreground")}
          >
            {source ? source.title : t("viewer.loadingText")}
          </h2>
        </div>
        {source?.editable ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0 gap-1 px-2 md:min-h-8"
            onClick={() => openNoteEditor(sourceId)}
          >
            <IconPencil aria-hidden />
            {t("note.edit")}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 shrink-0 gap-1 px-2 md:min-h-8"
          disabled={!selected}
          onClick={askAboutSelection}
        >
          <IconQuote aria-hidden />
          <span className="sr-only md:not-sr-only">{t("viewer.ask")}</span>
        </Button>
        {source ? (
          <SourceActionsMenu
            source={source}
            onRename={() => actions.startRename(source)}
            onSync={() => actions.sync(source)}
            onRemove={() => actions.startRemove(source)}
          />
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
          {detail.isPending ? (
            <div role="status" aria-busy="true" aria-label={t("viewer.loadingText")} className="flex flex-col gap-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : null}
          {detail.isError ? (
            <StateView state="error" error={detail.error} onRetry={() => void detail.refetch()} />
          ) : null}
          {actions.syncError ? (
            <p role="alert" className="text-destructive text-sm">
              {actions.syncError}
            </p>
          ) : null}
          {source && source.status !== "ready" ? (
            <SourceBanner source={source} onSync={() => actions.sync(source)} />
          ) : null}
          {source && readable ? <SourceGuide source={source} /> : null}
          {source && readable ? (
            <div ref={textRef}>
              <PassageList notebookId={notebookId} sourceId={sourceId} passageId={passageId} />
            </div>
          ) : null}
        </div>
      </div>
      {selected ? <SelectionToolbar selection={selected} onAsk={askAboutSelection} /> : null}
      <SourceActionDialogs actions={actions} />
    </section>
  )
}
