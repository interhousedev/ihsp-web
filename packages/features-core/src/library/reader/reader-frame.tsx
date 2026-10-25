"use client"

import type { Annotation, AnnotationColor, ItemDetail, ItemFile } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { useIsMobile } from "@ihsp/ui"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { AddToNotebookDialog, ReportDialog } from "../catalog"
import { useLibraryAccess } from "../hooks/use-library-access"
import { itemHref } from "../utils/hrefs"
import { AnnotationList } from "./annotation-list"
import { EpubReader } from "./epub-reader"
import { GoToPageDialog } from "./go-to-page-dialog"
import { itemFileLinks } from "./lib/file-link"
import type { ReaderEngines } from "./lib/load-engines"
import type { Locator } from "./lib/locator"
import { isCfiLocator, isPageLocator } from "./lib/locator"
import { stepZoom, useReaderSettings } from "./lib/reader-settings"
import { NoteDialog } from "./note-dialog"
import { PdfReader } from "./pdf-reader"
import { ReaderFooter } from "./reader-footer"
import { ReaderMenu } from "./reader-menu"
import { ReaderSheet } from "./reader-sheet"
import { ReaderToolbar } from "./reader-toolbar"
import {
  searchLanguage,
  tocFromFile,
  type ReaderHandle,
  type ReaderPosition,
  type ReaderSelection,
  type ReaderTocEntry,
  type ReaderViewProps,
  type SearchHit,
} from "./reader-types"
import { SearchPanel } from "./search-panel"
import { SelectionToolbar } from "./selection-toolbar"
import { SettingsPanel } from "./settings-panel"
import { TextReader } from "./text-reader"
import { TocPanel } from "./toc-panel"
import { useInertShell } from "./use-inert-shell"
import { useProgressSaver } from "./use-progress-saver"
import { useReaderAnnotations, type ViewAnnotation } from "./use-reader-annotations"
import { useReaderKeys } from "./use-reader-keys"

export type ReaderFrameProps = {
  item: ItemDetail
  file: ItemFile
  /** Where to open (`?page=` / `?loc=` or the place saved on this device). */
  start: Locator | null
  /** The fraction to open at when there is no locator. */
  startFraction: number | null
  /** Replaces pdf.js / foliate-js (tests). */
  engines?: ReaderEngines
}

type NoteDraft =
  | { mode: "create"; locator: Locator; quote: string | null }
  | { mode: "edit"; annotation: ViewAnnotation }

type Format = "pdf" | "epub" | "text"

const formatOf = (file: ItemFile): Format => (file.format === "pdf" ? "pdf" : file.format === "epub" ? "epub" : "text")

/** The bookmark at the place the reader is at, if there is one. */
function bookmarkAt(list: readonly ViewAnnotation[], position: ReaderPosition | null): ViewAnnotation | undefined {
  if (!position) return undefined
  const here = position.locator
  return list.find((entry) => {
    if (entry.kind !== "bookmark") return false
    if (isPageLocator(here) && isPageLocator(entry.locator)) return entry.locator.page === here.page
    return isCfiLocator(here) && isCfiLocator(entry.locator) && entry.locator.cfi === here.cfi
  })
}

/**
 * The reader: top bar, the view of the file (PDF, EPUB or text), progress footer, the panels (contents, search,
 * settings, menu, notes) and the selection toolbar. It covers the window so the page gets all the room on a phone. It
 * owns the annotations and the reading progress; the views only draw the file and report where they are.
 */
export function ReaderFrame({ item, file, start, startFraction, engines }: ReaderFrameProps) {
  const t = useT("library.reader")
  const annotationT = useT("library.annotation")
  const { signedIn } = useLibraryAccess()
  const mobile = useIsMobile()
  const itemId = item.id!
  const format = formatOf(file)

  const links = useMemo(() => itemFileLinks(itemId, file.id), [itemId, file.id])
  const [settings, updateSettings] = useReaderSettings()
  const notes = useReaderAnnotations({ itemId, fileId: file.id, enabled: signedIn })
  const progress = useProgressSaver({ itemId, fileId: file.id, enabled: signedIn })
  const view = useRef<ReaderHandle>(null)
  const root = useRef<HTMLDivElement>(null)

  const [position, setPosition] = useState<ReaderPosition | null>(null)
  const [selection, setSelection] = useState<ReaderSelection | null>(null)
  const [pages, setPages] = useState<number | null>(file.pages)
  const [announcement, setAnnouncement] = useState("")

  const [contentsOpen, setContentsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [gotoOpen, setGotoOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState<NoteDraft | null>(null)
  const [notebookPage, setNotebookPage] = useState<{ page: number | null } | null>(null)
  const [viewToc, setViewToc] = useState<ReaderTocEntry[] | null>(null)
  const [tocLoading, setTocLoading] = useState(false)

  useInertShell(true)
  useEffect(() => {
    root.current?.focus()
  }, [])

  const { report } = progress
  const onPosition = useCallback(
    (next: ReaderPosition) => {
      setPosition(next)
      report(next.locator, next.fraction)
    },
    [report],
  )
  const onReady = useCallback((info: { pages: number | null }) => {
    if (info.pages) setPages(info.pages)
  }, [])
  const onError = useCallback(() => undefined, [])
  const onAnnotationClick = useCallback((id: string) => {
    setActiveId(id)
    setNotesOpen(true)
  }, [])

  // - - - Contents - - -

  const serverToc = useMemo(() => tocFromFile(file.toc), [file.toc])
  const wantsViewToc = format === "epub" || serverToc.length === 0
  const entries = format === "epub" && viewToc ? viewToc : serverToc.length > 0 ? serverToc : (viewToc ?? [])

  function openContents() {
    setContentsOpen(true)
    if (wantsViewToc && viewToc === null && !tocLoading && view.current?.loadToc) {
      setTocLoading(true)
      view.current
        .loadToc()
        .then(setViewToc)
        .catch(() => setViewToc([]))
        .finally(() => setTocLoading(false))
    }
  }

  /** The search of the view; before the view is ready it finds nothing. */
  const searchInView = useCallback(
    (query: string, signal: AbortSignal): AsyncIterable<SearchHit> =>
      view.current?.search?.(query, signal) ?? (async function* (): AsyncGenerator<SearchHit> {})(),
    [],
  )

  // - - - Annotations from the selection - - -

  const canAnnotate = signedIn
  const canNotebook = signedIn && item.can.add_to_notebook && file.text_status !== "no_text"

  function dismissSelection() {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  function say(message: string) {
    setAnnouncement(message)
  }

  function highlight(color: AnnotationColor) {
    if (!selection) return
    updateSettings({ color })
    void notes.create({ kind: "highlight", locator: selection.locator, quote: selection.text, color })
    say(annotationT("saved"))
    dismissSelection()
  }

  function startNote() {
    if (!selection) return
    setDraft({ mode: "create", locator: selection.locator, quote: selection.text })
  }

  function copySelection() {
    if (!selection) return
    navigator.clipboard
      ?.writeText(selection.text)
      .then(() => toast.success(annotationT("copied")))
      .catch(() => toast.error(annotationT("copyFailed")))
    dismissSelection()
  }

  function saveNote(value: { note: string; color: AnnotationColor }) {
    if (!draft) return
    updateSettings({ color: value.color })
    if (draft.mode === "create") {
      void notes.create({
        kind: "note",
        locator: draft.locator,
        quote: draft.quote,
        note: value.note,
        color: value.color,
      })
      say(annotationT("saved"))
      dismissSelection()
    } else {
      void notes.update(draft.annotation, { note: value.note || null, color: value.color })
    }
    setDraft(null)
  }

  const bookmark = bookmarkAt(notes.annotations, position)
  function toggleBookmark() {
    if (!position) return
    if (!canAnnotate) {
      toast(annotationT("signIn"))
      return
    }
    if (bookmark) {
      void notes.remove(bookmark)
      say(annotationT("bookmarkRemoved"))
    } else {
      void notes.create({ kind: "bookmark", locator: position.locator, quote: null, color: settings.color })
      say(annotationT("bookmarkAdded"))
    }
  }

  function openAnnotation(annotation: Annotation) {
    view.current?.goToLocator(annotation.locator)
    if (mobile) setNotesOpen(false)
  }

  // - - - Keyboard - - -

  useReaderKeys(true, (action) => {
    switch (action) {
      case "next":
        view.current?.next()
        return true
      case "prev":
        view.current?.prev()
        return true
      case "first":
        view.current?.first()
        return true
      case "last":
        view.current?.last()
        return true
      case "search":
        setSearchOpen(true)
        return true
      case "goto":
        if (!view.current?.goToPage || !pages) return false
        setGotoOpen(true)
        return true
      case "highlight":
        if (!canAnnotate) toast(annotationT("signIn"))
        else if (selection) highlight(settings.color)
        else toast(annotationT("selectFirst"))
        return true
      case "note":
        if (!canAnnotate) toast(annotationT("signIn"))
        else if (selection) startNote()
        else toast(annotationT("selectFirst"))
        return true
      case "bookmark":
        toggleBookmark()
        return true
      case "zoom-in":
      case "zoom-out":
        if (format !== "pdf") return false
        updateSettings({ pageFit: "custom", zoom: stepZoom(settings.zoom, action === "zoom-in" ? 1 : -1) })
        return true
      case "escape":
        if (selection) {
          dismissSelection()
          return true
        }
        if (notesOpen && !mobile) {
          setNotesOpen(false)
          return true
        }
        return false
    }
  })

  // - - - The view - - -

  const common: ReaderViewProps = {
    item,
    file,
    links,
    start,
    startFraction,
    annotations: notes.annotations,
    settings,
    language: searchLanguage(item.language),
    onPosition,
    onSelection: setSelection,
    onAnnotationClick,
    onReady,
    onError,
    ref: view,
  }
  const body =
    format === "pdf" ? (
      <PdfReader {...common} {...(engines?.pdf ? { loadEngine: engines.pdf } : {})} />
    ) : format === "epub" ? (
      <EpubReader {...common} {...(engines?.epub ? { loadEngine: engines.epub } : {})} />
    ) : (
      <TextReader {...common} />
    )

  const list = (
    <AnnotationList
      annotations={notes.annotations}
      activeId={activeId}
      canEdit={canAnnotate}
      onOpen={openAnnotation}
      onEdit={(annotation) => setDraft({ mode: "edit", annotation })}
      onRemove={(annotation) => void notes.remove(annotation)}
      onRetry={(annotation) => void notes.retry(annotation)}
      onDiscard={(annotation) => notes.discard(annotation)}
    />
  )

  return (
    <div ref={root} tabIndex={-1} data-reader className="bg-background fixed inset-0 z-40 flex flex-col outline-none">
      <ReaderToolbar
        title={item.title}
        backHref={itemHref(itemId)}
        onContents={openContents}
        onSearch={() => setSearchOpen(true)}
        onNotes={() => setNotesOpen((open) => !open)}
        notesOpen={notesOpen && !mobile}
        onSettings={() => setSettingsOpen(true)}
        onMenu={() => setMenuOpen(true)}
        waiting={notes.waiting}
      />
      {file.text_status === "no_text" ? (
        <p role="status" className="bg-muted text-muted-foreground shrink-0 border-b px-3 py-2 text-xs">
          {t("noText")}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <div role="region" aria-label={t("view")} className="relative min-w-0 flex-1">
          {body}
        </div>
        {notesOpen && !mobile ? (
          <aside aria-label={annotationT("panelTitle")} className="bg-background flex w-80 shrink-0 flex-col border-s">
            <h2 className="border-b p-3 text-sm font-medium">{annotationT("panelTitle")}</h2>
            {list}
          </aside>
        ) : null}
      </div>
      <ReaderFooter
        position={position}
        pages={pages}
        onPrev={() => view.current?.prev()}
        onNext={() => view.current?.next()}
        onGoTo={format === "pdf" && pages ? () => setGotoOpen(true) : null}
        bookmarked={canAnnotate ? bookmark !== undefined : null}
        onBookmark={toggleBookmark}
        onNotes={() => setNotesOpen(true)}
      />
      <p aria-live="polite" role="status" className="sr-only">
        {announcement}
      </p>

      {selection ? (
        <SelectionToolbar
          selection={selection}
          canAnnotate={canAnnotate}
          canNotebook={canNotebook}
          color={settings.color}
          onHighlight={highlight}
          onNote={startNote}
          onCopy={copySelection}
          onNotebook={() => setNotebookPage({ page: selection.page })}
          onDismiss={dismissSelection}
        />
      ) : null}

      <TocPanel
        open={contentsOpen}
        onOpenChange={setContentsOpen}
        entries={entries}
        loading={tocLoading}
        onSelect={(entry) => view.current?.goToToc(entry)}
      />
      <SearchPanel
        open={searchOpen}
        onOpenChange={setSearchOpen}
        noText={file.text_status === "no_text"}
        search={searchInView}
        onSelect={(hit) => view.current?.showHit?.(hit)}
        onClear={() => view.current?.clearSearch?.()}
      />
      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        format={format}
        settings={settings}
        onChange={updateSettings}
      />
      <ReaderMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        item={item}
        file={file}
        signedIn={signedIn}
        onReport={() => setReportOpen(true)}
      />
      {mobile ? (
        <ReaderSheet open={notesOpen} onOpenChange={setNotesOpen} title={annotationT("panelTitle")}>
          {list}
        </ReaderSheet>
      ) : null}
      {pages ? (
        <GoToPageDialog
          open={gotoOpen}
          onOpenChange={setGotoOpen}
          pages={pages}
          current={position?.page ?? 1}
          onGo={(page) => view.current?.goToPage?.(page)}
        />
      ) : null}
      <NoteDialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null)
        }}
        mode={draft?.mode ?? "create"}
        quote={draft ? (draft.mode === "create" ? draft.quote : draft.annotation.quote) : null}
        note={draft?.mode === "edit" ? (draft.annotation.note ?? "") : ""}
        color={draft?.mode === "edit" ? draft.annotation.color : settings.color}
        onSave={saveNote}
      />
      {notebookPage ? (
        <AddToNotebookDialog
          open
          onOpenChange={(open) => {
            if (!open) setNotebookPage(null)
          }}
          itemId={itemId}
          fileId={file.id}
          title={item.title}
          pageCount={file.pages}
          pageFrom={notebookPage.page}
          pageTo={notebookPage.page}
          noText={file.text_status === "no_text"}
          toc={serverToc.map((entry) => ({
            title: entry.title,
            level: entry.level,
            ...(entry.page === null ? {} : { page: entry.page }),
          }))}
        />
      ) : null}
      <ReportDialog itemId={itemId} open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  )
}
