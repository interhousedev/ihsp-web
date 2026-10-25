"use client"

import type { ArtifactDetail, SlidesContent } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { ConfirmDialog, StateView } from "@ihsp/ui"
import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { toast } from "sonner"
import { useUpdateSlides } from "../../api/use-artifacts"
import { RefChips, citationsFromRefs } from "../../chat/ref-chips"
import { copyText } from "../../lib/download"
import { EditBar } from "./edit-bar"
import { NotesPanel } from "./notes-panel"
import { PrintStack } from "./print-stack"
import { RevisePanel } from "./revise-panel"
import { SaveBar } from "./save-bar"
import { SlideControls } from "./slide-controls"
import { SlideEditor } from "./slide-editor"
import { SlideView } from "./slide-view"
import { cleanSlides } from "./slide-deck-state"
import { Slideshow } from "./slideshow"
import { SlidesToolbar, type DeckMode } from "./slides-toolbar"
import { slidesToOutline } from "./slides-outline"
import { ThumbnailStrip } from "./thumbnail-strip"
import { useSlideDeck } from "./use-slide-deck"
import { useSlideRevision } from "./use-slide-revision"

type SlidesDeckProps = {
  notebookId: string
  artifact: Extract<ArtifactDetail, { kind: "slides" }>
  content: SlidesContent
}

const EDITABLE_TARGET = "input, textarea, select, [contenteditable='true'], [aria-roledescription='sortable']"

/** The slide deck viewer once the content is there: toolbar, thumbnails, stage, editor, reviser, slideshow, print. */
export function SlidesDeck({ notebookId, artifact, content }: SlidesDeckProps) {
  const t = useT("notebooks.slides")
  const tSources = useT("notebooks.sources")
  const tKind = useT("notebooks.kind")
  const tCommon = useT("common")
  const deck = useSlideDeck(content.slides)
  const update = useUpdateSlides(notebookId, artifact.id)
  const revision = useSlideRevision({ notebookId, artifactId: artifact.id, slides: deck.slides })
  const [mode, setMode] = useState<DeckMode>("view")
  const [notesOpen, setNotesOpen] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [announcement, setAnnouncement] = useState("")

  // A page with unsaved edits asks before it is closed or reloaded.
  const { dirty } = deck
  useEffect(() => {
    if (!dirty) return
    const listener = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", listener)
    return () => window.removeEventListener("beforeunload", listener)
  }, [dirty])

  const marked = useMemo(
    () => new Set(mode === "revise" ? revision.pending.map((change) => change.slide_id) : []),
    [mode, revision.pending],
  )
  const { current, index, slides } = deck
  if (!current) return <StateView state="empty" emptyText={t("empty")} />

  function save() {
    const cleaned = cleanSlides(slides)
    update.mutate(cleaned, { onSuccess: () => deck.markSaved(cleaned) })
  }

  function move(from: number, to: number) {
    deck.move(from, to)
    setAnnouncement(t("moved", { from: from + 1, to: to + 1, count: slides.length }))
  }

  async function copyOutline() {
    const text = slidesToOutline(content, slides, { notes: t("notes") })
    if (await copyText(text)) toast.success(tCommon("copied"))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (presenting || event.ctrlKey || event.metaKey || event.altKey) return
    if (event.target instanceof HTMLElement && event.target.closest(EDITABLE_TARGET)) return
    if (event.key === "ArrowRight") deck.next()
    else if (event.key === "ArrowLeft") deck.prev()
    else if (event.key === "n" || event.key === "N") setNotesOpen((open) => !open)
    else return
    event.preventDefault()
  }

  const showRefs = citationsFromRefs(current.refs, artifact.refs_index).length > 0

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the shortcuts (arrows, N) listen to keys that bubble up from the focusable controls inside
    <div
      role="group"
      aria-label={content.title || tKind("slides")}
      className="flex flex-col gap-3"
      onKeyDown={handleKeyDown}
    >
      <SlidesToolbar
        mode={mode}
        notesOpen={notesOpen}
        onMode={setMode}
        onToggleNotes={() => setNotesOpen((open) => !open)}
        onStart={() => setPresenting(true)}
        onCopyOutline={() => void copyOutline()}
        onPrint={() => {
          if (typeof window.print === "function") window.print()
        }}
      />
      <div className="flex items-start gap-4">
        <ThumbnailStrip
          slides={slides}
          currentId={current.id}
          deckSubtitle={content.subtitle}
          sortable={mode === "edit"}
          marked={marked}
          onSelect={(slide) => deck.select(slide.id)}
          onMove={move}
        />
        <div className="mx-auto flex w-full min-w-0 max-w-4xl flex-1 flex-col gap-3">
          <section aria-label={t("stage")}>
            <SlideView slide={current} deckSubtitle={content.subtitle} showHint={mode === "edit"} />
          </section>
          <SlideControls index={index} total={slides.length} onPrevious={deck.prev} onNext={deck.next} />
          {showRefs ? (
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-muted-foreground">{tSources("title")}</span>
              <RefChips refs={current.refs} refsIndex={artifact.refs_index} />
            </div>
          ) : null}
          {notesOpen ? <NotesPanel notes={current.notes} /> : null}
          {mode === "edit" ? (
            <>
              <EditBar
                index={index}
                total={slides.length}
                onMove={(delta) => move(index, index + delta)}
                onDelete={() => setConfirmingDelete(true)}
              />
              <SlideEditor slide={current} number={index + 1} onPatch={(patch) => deck.patch(current.id, patch)} />
            </>
          ) : null}
          {mode === "revise" ? (
            <RevisePanel
              slides={slides}
              slide={current}
              number={index + 1}
              revision={revision}
              blocked={dirty}
              onSelect={deck.select}
            />
          ) : null}
          {mode === "edit" || dirty ? (
            <SaveBar
              dirty={dirty}
              saving={update.isPending}
              error={update.error}
              onSave={save}
              onDiscard={deck.discard}
            />
          ) : null}
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      {presenting ? (
        <Slideshow
          slides={slides}
          index={index}
          deckSubtitle={content.subtitle}
          notesOpen={notesOpen}
          onGoTo={deck.goTo}
          onToggleNotes={() => setNotesOpen((open) => !open)}
          onExit={() => setPresenting(false)}
        />
      ) : null}
      <PrintStack slides={slides} deckSubtitle={content.subtitle} />
      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={t("delete")}
        destructive
        onConfirm={() => {
          deck.remove(current.id)
          setConfirmingDelete(false)
        }}
      />
    </div>
  )
}
