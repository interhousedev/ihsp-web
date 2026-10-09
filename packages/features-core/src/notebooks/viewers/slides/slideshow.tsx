"use client"

import type { Slide } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { IconNotes } from "@tabler/icons-react"
import { useEffect, useRef } from "react"
import { NotesPanel } from "./notes-panel"
import { SlideView } from "./slide-view"
import { useFullscreen } from "./use-fullscreen"

type SlideshowProps = {
  slides: readonly Slide[]
  /** 0-based. */
  index: number
  deckSubtitle?: string | null
  notesOpen: boolean
  onGoTo: (index: number) => void
  onToggleNotes: () => void
  onExit: () => void
}

/** Keys that are about the keyboard focus (a focused button uses Space itself) are not taken over. */
function isInteractive(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement && target.closest("button, a, input, textarea, select, [contenteditable]") !== null
  )
}

/**
 * The slideshow: the slide fills the screen (the Fullscreen API where there is one, a fixed overlay everywhere).
 * Right, Down, Space and Page Down go forward, Left, Up and Page Up back, Home and End jump, `N` toggles the notes
 * and Esc leaves. Nothing traps the focus; when the show ends the focus returns to where it was.
 */
export function Slideshow({ slides, index, deckSubtitle, notesOpen, onGoTo, onToggleNotes, onExit }: SlideshowProps) {
  const t = useT("notebooks.slides")
  const rootRef = useRef<HTMLDivElement>(null)
  const slide = slides[index]
  const last = slides.length - 1

  useFullscreen(rootRef, onExit)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    rootRef.current?.focus()
    return () => previous?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      const go = (target: number) => {
        event.preventDefault()
        onGoTo(Math.min(Math.max(target, 0), last))
      }
      switch (event.key) {
        case "Escape":
          event.preventDefault()
          onExit()
          return
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
          go(index + 1)
          return
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          go(index - 1)
          return
        case " ":
          if (!isInteractive(event.target)) go(index + 1)
          return
        case "Home":
          go(0)
          return
        case "End":
          go(last)
          return
        case "n":
        case "N":
          event.preventDefault()
          onToggleNotes()
          return
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [index, last, onExit, onGoTo, onToggleNotes])

  if (!slide) return null
  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="false"
      aria-label={t("slideshow")}
      tabIndex={-1}
      className="bg-background fixed inset-0 z-[100] flex flex-col outline-hidden"
    >
      <div className="grid min-h-0 flex-1 [container-type:size] place-items-center p-2 md:p-4">
        <div className="w-[min(100cqw,calc(100cqh*16/9))]">
          <SlideView slide={slide} deckSubtitle={deckSubtitle} className="shadow-lg" />
        </div>
      </div>
      {notesOpen ? <NotesPanel notes={slide.notes} className="mx-2 max-h-[30dvh] overflow-y-auto md:mx-4" /> : null}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 md:p-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={t("previous")}
            disabled={index <= 0}
            onClick={() => onGoTo(index - 1)}
          >
            <Icons.chevronLeft aria-hidden />
          </Button>
          <p aria-live="polite" className="text-sm font-medium tabular-nums">
            {t("slideOf", { current: index + 1, total: slides.length })}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={t("next")}
            disabled={index >= last}
            onClick={() => onGoTo(index + 1)}
          >
            <Icons.chevronRight aria-hidden />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={notesOpen ? "secondary" : "outline"}
            className="min-h-11"
            aria-pressed={notesOpen}
            aria-keyshortcuts="N"
            onClick={onToggleNotes}
          >
            <IconNotes aria-hidden />
            {t("notes")}
          </Button>
          <span className="text-muted-foreground hidden text-xs sm:inline">{t("exit")}</span>
          <Button type="button" variant="outline" className="min-h-11" onClick={onExit}>
            <Icons.close aria-hidden />
            {t("exitShow")}
          </Button>
        </div>
      </div>
    </div>
  )
}
