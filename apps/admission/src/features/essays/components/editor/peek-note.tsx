"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@ihsp/ui"
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { useEssay, useEssays } from "../../api"
import { usePhone } from "./use-wide"

const STORAGE_KEY = "admission.essayPeek.position"
const WIDTH = 360
const HEIGHT = 420
const MARGIN = 8

type Point = { x: number; y: number }

/** Keeps the window of `w` x `h` fully inside the viewport. */
export function clampPoint(p: Point, w: number, h: number, vw: number, vh: number): Point {
  return {
    x: Math.min(Math.max(MARGIN, p.x), Math.max(MARGIN, vw - w - MARGIN)),
    y: Math.min(Math.max(MARGIN, p.y), Math.max(MARGIN, vh - h - MARGIN)),
  }
}

function loadPoint(): Point | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const value = raw ? (JSON.parse(raw) as Partial<Point>) : null
    return value && Number.isFinite(value.x) && Number.isFinite(value.y) ? (value as Point) : null
  } catch {
    return null
  }
}

/** The picker and the read-only view of the chosen essay: its title, its prompt and its text. */
function PeekBody({ currentId }: { currentId: string }) {
  const t = useT("essayEditor")
  const te = useT("essays")
  const list = useEssays()
  const [id, setId] = useState("")
  const others = (list.data?.items ?? []).filter((e) => e.id !== currentId && !e.unreadable)
  const essay = useEssay(id || null)
  const prompt = essay.data?.prompt_text.trim() || essay.data?.targets[0]?.prompt || ""
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <select
        aria-label={t("peekPick")}
        value={id}
        onChange={(event) => setId(event.target.value)}
        className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
      >
        <option value="">{others.length ? t("peekPick") : t("peekEmpty")}</option>
        {others.map((e) => (
          <option key={e.id} value={e.id}>
            {e.title || te("untitled")}
          </option>
        ))}
      </select>
      {essay.data ? (
        <div data-testid="peek-essay" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          <h3 className="m-0 text-sm font-semibold">{essay.data.title || te("untitled")}</h3>
          {prompt ? (
            <p className="text-muted-foreground m-0 text-xs break-words">
              <span className="font-medium">{t("peekPrompt")}: </span>
              {prompt}
            </p>
          ) : null}
          {essay.data.body.trim() ? (
            <div
              data-testid="peek-text"
              className="text-sm leading-relaxed break-words whitespace-pre-wrap select-text"
            >
              {essay.data.body}
            </div>
          ) : (
            <p className="text-muted-foreground m-0 text-sm">{t("peekNoText")}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}

/**
 * A sticky note over the editor: the student's other essays, read-only, in a window that drags by its header and
 * remembers where it was left. On a phone the same content opens in a bottom sheet.
 */
export function PeekNote({ open, onClose, currentId }: { open: boolean; onClose: () => void; currentId: string }) {
  const t = useT("essayEditor")
  const phone = usePhone()
  const box = useRef<HTMLDivElement>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const [pos, setPos] = useState<Point | null>(null)

  const fit = useCallback((p: Point) => {
    const h = box.current?.offsetHeight || HEIGHT
    const w = box.current?.offsetWidth || WIDTH
    return clampPoint(p, w, h, window.innerWidth, window.innerHeight)
  }, [])

  useEffect(() => {
    if (!open || phone) return
    setPos((prev) => fit(prev ?? loadPoint() ?? { x: window.innerWidth - WIDTH - 24, y: 96 }))
  }, [open, phone, fit])

  useEffect(() => {
    if (!open || phone) return
    const onResize = () => setPos((prev) => (prev ? fit(prev) : prev))
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [open, phone, fit])

  if (!open) return null

  if (phone)
    return (
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="bottom" className="max-h-[88dvh] gap-0 overflow-hidden" data-testid="peek-sheet">
          <SheetHeader className="border-hairline border-b pr-14">
            <SheetTitle className="text-lg font-semibold">{t("peekTitle")}</SheetTitle>
            <SheetDescription className="sr-only">{t("peekHint")}</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-[40dvh] flex-1 flex-col overflow-hidden p-4">
            <PeekBody currentId={currentId} />
          </div>
        </SheetContent>
      </Sheet>
    )

  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return
    const rect = box.current?.getBoundingClientRect()
    if (!rect) return
    drag.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (d) setPos(fit({ x: event.clientX - d.dx, y: event.clientY - d.dy }))
  }
  const up = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    drag.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    if (pos)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
      } catch {
        /* storage is optional */
      }
  }

  return (
    <div
      ref={box}
      role="dialog"
      aria-label={t("peekTitle")}
      data-testid="peek-note"
      style={{ position: "fixed", left: pos?.x ?? MARGIN, top: pos?.y ?? MARGIN, width: WIDTH, height: HEIGHT }}
      className="bg-warning/15 border-warning/40 text-foreground z-50 flex max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg border shadow-xl backdrop-blur"
    >
      <div
        data-testid="peek-handle"
        title={t("peekDrag")}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="border-warning/40 bg-warning/25 flex cursor-grab touch-none items-center gap-2 border-b px-3 py-1.5 select-none active:cursor-grabbing"
      >
        <Icons.eye aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{t("peekTitle")}</span>
        <Button type="button" size="icon-sm" variant="ghost" aria-label={t("peekClose")} onClick={onClose}>
          <Icons.close aria-hidden />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <PeekBody currentId={currentId} />
      </div>
    </div>
  )
}
