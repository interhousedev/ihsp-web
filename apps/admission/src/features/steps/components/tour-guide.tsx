"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons } from "@ihsp/ui"
import { TOUR_DISMISSED_ID, usePreferences, useUpdatePreferences } from "@ihsp/features-core"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { useDrag } from "../hooks/use-drag"
import { usePhone } from "../hooks/use-phone"
import { useTargetRect } from "../hooks/use-target-rect"
import { useTour, useTourReplay } from "../hooks/use-tour"
import { TOUR_STOPS, tourReducers, type TourPoint, type TourState } from "../tour-state"

const withSlash = (path: string | null) => (path?.endsWith("/") ? path : `${path ?? ""}/`)

/** Inline position of a dragged box; phones keep the block pinned above the bottom bar. */
const placed = (point: TourPoint | null, phone: boolean): CSSProperties | undefined =>
  point && !phone ? { left: point.x, top: point.y, right: "auto", bottom: "auto" } : undefined

function Highlight({ href }: { href: string }) {
  const rect = useTargetRect(href)
  if (!rect) return null
  return (
    <div
      data-testid="tour-highlight"
      aria-hidden
      className="ring-primary pointer-events-none fixed rounded-lg ring-2 ring-offset-2 ring-offset-transparent motion-safe:animate-pulse"
      style={{ top: rect.top - 2, left: rect.left - 2, width: rect.width + 4, height: rect.height + 4 }}
    />
  )
}

/**
 * The first-run tour of the platform. It never covers the page: the root ignores the pointer, only the card (or the
 * small circle it collapses into) takes clicks, so the student can use the page under it at any time. On desktop it
 * highlights the sidebar link of each page and goes there; on a phone a text block at the bottom advances by itself.
 * Its step and the places the student dragged it to are kept in localStorage.
 */
export function TourGuide({ storageKey }: { storageKey: string }) {
  const t = useT("tour")
  const router = useRouter()
  const pathname = usePathname()
  const phone = usePhone()
  const [state, update] = useTour(storageKey)
  const cardRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLButtonElement>(null)
  const cardDrag = useDrag(
    () => cardRef.current,
    (card) => update((s) => tourReducers.moveCard(s, card)),
  )
  const dotDrag = useDrag(
    () => dotRef.current,
    (dot) => update((s) => tourReducers.moveDot(s, dot)),
  )

  const status = state?.status
  const step = state?.step ?? 0
  const stop = TOUR_STOPS[step]

  const preferences = usePreferences()
  const updatePreferences = useUpdatePreferences()
  const dismissed = preferences?.onboarding_dismissed?.includes(TOUR_DISMISSED_ID) ?? false
  const [replay, setReplay] = useState(false)
  useTourReplay(
    useCallback(() => {
      setReplay(true)
      update(tourReducers.start)
    }, [update]),
  )
  // Skip, close and the last Next end the tour here: it is hidden at once and the id is written to the server.
  useEffect(() => {
    if (status !== "done") return
    setReplay(false)
    if (preferences && !dismissed)
      updatePreferences.mutate({
        onboarding_dismissed: [...new Set([...(preferences.onboarding_dismissed ?? []), TOUR_DISMISSED_ID])],
      })
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [status])
  // A tour already dismissed on the server never reopens from a stale local state (other device, cleared cache).
  useEffect(() => {
    if (dismissed && !replay && status && status !== "done") update(tourReducers.finish)
  }, [dismissed, replay, status, update])

  // The tour only opens a page on the student's own Start/Next/Back; it never redirects. `pending` is the page the tour
  // itself just asked for. Landing on the next stop by hand completes that step; any other page minimizes the tour.
  const pending = useRef<string | null>(null)
  const lastPath = useRef<string | null>(null)
  useEffect(() => {
    const path = withSlash(pathname)
    const changed = lastPath.current !== null && lastPath.current !== path
    lastPath.current = path
    if (pending.current === path) pending.current = null
    if (!changed || status !== "touring" || pending.current !== null || path === stop.href) return
    if (TOUR_STOPS[step + 1]?.href === path) update(tourReducers.next)
    else update(tourReducers.collapse)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const go = (change: (s: TourState) => TourState, index: number) => {
    const target = TOUR_STOPS[index]
    if (target && withSlash(pathname) !== target.href) {
      pending.current = target.href
      router.push(target.href)
    }
    update(change)
  }

  // The server preference is the truth; the saved state is only this device's cache of the step and positions.
  // The welcome card appears on Home only, so no other page is covered by a first-run prompt.
  const home = withSlash(pathname) === "/"
  const visible =
    state !== null &&
    preferences !== null &&
    (replay || (!dismissed && state.status !== "done" && (state.status !== "intro" || home)))
  if (!state || !visible) return null
  const last = step === TOUR_STOPS.length - 1
  const stepText = t("step", { current: step + 1, total: TOUR_STOPS.length })

  return (
    <div data-testid="tour-root" className="pointer-events-none fixed inset-0 z-40 print:hidden">
      {state.status === "touring" && !phone ? <Highlight href={stop.href} /> : null}

      {state.status === "collapsed" ? (
        <button
          ref={dotRef}
          type="button"
          aria-label={t("expand")}
          title={t("expand")}
          style={placed(state.dot, false)}
          onClick={() => {
            if (!dotDrag.consumeDrag()) update(tourReducers.expand)
          }}
          {...dotDrag.handlers}
          className={cn(
            "bg-primary text-primary-foreground pointer-events-auto fixed grid size-11 touch-none place-items-center rounded-full shadow-lg",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            !state.dot &&
              "top-[calc(var(--safe-top,0px)+0.75rem)] left-2 md:left-[calc(var(--sidebar-width,16rem)+0.5rem)]",
          )}
        >
          <Icons.route aria-hidden className="size-5" />
          <span className="bg-background text-foreground absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border text-[10px] font-semibold tabular-nums">
            {step + 1}
          </span>
        </button>
      ) : (
        <div
          ref={cardRef}
          role="region"
          aria-label={t("label")}
          style={placed(state.card ?? (state.dot ? { x: state.dot.x, y: state.dot.y + 52 } : null), phone)}
          className={cn(
            "bg-card text-card-foreground rounded-card pointer-events-auto fixed flex flex-col gap-2 border p-3 shadow-xl md:gap-3 md:p-4",
            "max-h-[40dvh] overflow-y-auto inset-x-2 bottom-[calc(var(--bottom-nav-height,4.5rem)+var(--safe-bottom,0px)+0.5rem)] md:max-h-[60dvh]",
            "md:inset-x-auto md:top-auto md:right-4 md:bottom-4 md:left-auto md:w-80",
          )}
        >
          {state.status === "intro" ? (
            <>
              <div>
                <h2 className="text-base font-semibold">{t("introTitle")}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t("introText")}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => update(tourReducers.finish)}>
                  {t("skip")}
                </Button>
                <Button type="button" size="sm" onClick={() => go(tourReducers.start, 0)}>
                  {t("start")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                {phone ? null : (
                  <span
                    aria-label={t("drag")}
                    title={t("drag")}
                    {...cardDrag.handlers}
                    className="text-muted-foreground -ml-1 cursor-grab touch-none rounded p-1 active:cursor-grabbing"
                  >
                    <Icons.gripVertical aria-hidden className="size-4" />
                  </span>
                )}
                <span className="text-muted-foreground flex-1 text-xs font-medium tabular-nums">{stepText}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("collapse")}
                  title={t("collapse")}
                  onClick={() => update(tourReducers.collapse)}
                >
                  <Icons.chevronDown aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("close")}
                  title={t("close")}
                  onClick={() => update(tourReducers.finish)}
                >
                  <Icons.close aria-hidden />
                </Button>
              </div>
              <div aria-live="polite">
                <h2 className="text-base font-semibold">{t(`steps.${stop.id}.title`)}</h2>
                <p className="text-muted-foreground mt-1 text-sm">{t(`steps.${stop.id}.text`)}</p>
              </div>
              {phone ? (
                <div aria-hidden className="flex gap-1">
                  {TOUR_STOPS.map((s, index) => (
                    <span
                      key={s.id}
                      className={cn("h-1 flex-1 rounded-full", index <= step ? "bg-primary" : "bg-muted")}
                    />
                  ))}
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={step === 0}
                  onClick={() => go(tourReducers.back, step - 1)}
                >
                  <Icons.chevronLeft aria-hidden />
                  {t("back")}
                </Button>
                <Button type="button" size="sm" onClick={() => go(tourReducers.next, step + 1)}>
                  {last ? t("finish") : t("next")}
                  {last ? null : <Icons.chevronRight aria-hidden />}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
