"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, ResponsiveDialog, StateView } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { SwipeDeck, type SwipeDirection } from "../../../components/lib/swipe-deck"
import { ScrollFade } from "../../../components/scroll-fade"
import type { AdmissionMatch as Match } from "@ihsp/api"
import { ScreenSummary } from "../../assistant/screen-context"
import { AlgorithmPanel } from "../../algorithm/components/algorithm-panel"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useDecide, useMatches, useUndoDecision } from "../hooks"
import { ContextPanel } from "./context-panel"
import { MatchCard } from "./match-card"

type Layout = "mobile" | "tablet" | "desktop"

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange)
  return () => window.removeEventListener("resize", onChange)
}
const snapshot = (): Layout => (window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop")
const serverSnapshot = (): Layout => "desktop"

type Decided = { match: Match; direction: SwipeDirection }

const COLUMN_HEIGHT = "calc(100dvh - 9rem)"

/** The Kollegio-style matching feed: algorithm, swipe deck and assistant context. */
export function DiscoverPage() {
  const t = useT("discover")
  const errorMessage = useErrorMessage()
  const client = useQueryClient()
  const layout = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const matches = useMatches()
  const decide = useDecide()
  const undo = useUndoDecision()
  const [history, setHistory] = useState<Decided[]>([])
  const [stamp, setStamp] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const remaining = useMemo(() => {
    const seen = new Set(history.map((entry) => entry.match.university_id))
    return (matches.data?.items ?? []).filter((match) => !seen.has(match.university_id))
  }, [matches.data, history])
  const top = remaining[0]

  const exhausted = Boolean(matches.data) && remaining.length <= 2
  const settling = decide.isPending
  const fetching = matches.isFetching
  useEffect(() => {
    if (!exhausted || settling || fetching || history.length === 0) return
    void client.invalidateQueries({ queryKey: ["admission", "matches"] })
  }, [exhausted, settling, fetching, history.length, client])

  const served = matches.data?.items
  useEffect(() => {
    if (!served || fetching) return
    const present = new Set(served.map((match) => match.university_id))
    setHistory((current) => {
      const kept = current.filter(
        (entry, index) => index === current.length - 1 || present.has(entry.match.university_id),
      )
      return kept.length === current.length ? current : kept
    })
  }, [served, fetching])

  const onSwipe = useCallback(
    (match: Match, direction: SwipeDirection) => {
      setHistory((current) => [...current, { match, direction }])
      setStamp(direction === "right" ? t("stamp.interested") : t("stamp.notMyVibe"))
      decide.mutate(
        { id: match.university_id, decision: direction === "right" ? "interested" : "not_my_vibe" },
        {
          onError: (error) => {
            setHistory((current) => current.filter((entry) => entry.match.university_id !== match.university_id))
            setStamp(null)
            toast.error(errorMessage(error))
          },
        },
      )
    },
    [decide, errorMessage, t],
  )

  function undoLast() {
    const last = history[history.length - 1]
    if (!last) return
    setHistory((current) => current.slice(0, -1))
    setStamp(null)
    undo.mutate(last.match.university_id, {
      onError: (error) => {
        setHistory((current) => [...current, last])
        toast.error(errorMessage(error))
      },
    })
  }

  const refresh = () => void client.invalidateQueries({ queryKey: ["admission", "matches"] })
  const algorithm = <AlgorithmPanel onSaved={refresh} />
  const context = <ContextPanel match={top} />

  const deck = matches.isLoading ? (
    <StateView state="loading" rows={4} />
  ) : matches.isError ? (
    <StateView state="error" error={matches.error} onRetry={() => void matches.refetch()} />
  ) : (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <SwipeDeck
        className="h-[min(34rem,calc(100dvh-22rem))] min-h-[20rem] md:h-[min(34rem,calc(100dvh-16rem))] md:min-h-[26rem]"
        items={remaining}
        getKey={(match) => match.university_id}
        renderCard={(match) => <MatchCard match={match} />}
        onSwipe={onSwipe}
        rightStamp={t("stamp.interested")}
        leftStamp={t("stamp.notMyVibe")}
        label={t("deck.label")}
        empty={<StateView state="empty" title={t("empty.title")} description={t("empty.text")} />}
      />
      <p role="status" aria-live="polite" className="text-success h-5 text-center text-sm font-medium">
        {stamp}
      </p>
      <div className="bg-background/90 sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-center gap-3 py-2 pr-16 backdrop-blur md:static md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("undo")}
          disabled={history.length === 0 || undo.isPending || decide.isPending}
          onClick={undoLast}
        >
          <Icons.undo aria-hidden />
        </Button>
        <Button type="button" variant="outline" disabled={!top} onClick={() => top && onSwipe(top, "left")}>
          <Icons.thumbDown aria-hidden />
          {t("notMyVibe")}
          <kbd className="text-muted-foreground hidden text-xs md:inline">←</kbd>
        </Button>
        <Button type="button" disabled={!top} onClick={() => top && onSwipe(top, "right")}>
          <Icons.heart aria-hidden />
          {t("interested")}
          <kbd className="text-primary-foreground/70 hidden text-xs md:inline">→</kbd>
        </Button>
      </div>
    </div>
  )

  return (
    <AdmissionShell>
      <ScreenSummary
        title={t("title")}
        summary={
          top ? `Discover colleges. Top card: ${top.name}, ${top.city}, match ${top.match_pct}%.` : "Discover colleges."
        }
      />
      <div className="mx-auto flex w-full min-w-0 max-w-screen-2xl flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          {layout === "mobile" ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setPanelOpen(true)}>
              <Icons.discover aria-hidden />
              {t("algorithm.open")}
            </Button>
          ) : null}
          {layout === "tablet" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-expanded={panelOpen}
              onClick={() => setPanelOpen((open) => !open)}
            >
              <Icons.panelLeft aria-hidden />
              {panelOpen ? t("algorithm.hide") : t("algorithm.show")}
            </Button>
          ) : null}
        </div>
        {layout === "desktop" ? (
          <div className="grid grid-cols-[20rem_minmax(0,1fr)_20rem] items-start gap-6">
            <ScrollFade maxHeight={COLUMN_HEIGHT} className="pr-2">
              {algorithm}
            </ScrollFade>
            {deck}
            <ScrollFade maxHeight={COLUMN_HEIGHT} className="pr-2">
              {context}
            </ScrollFade>
          </div>
        ) : layout === "tablet" ? (
          <div className={panelOpen ? "grid grid-cols-[minmax(0,1fr)_18rem] items-start gap-4" : "grid grid-cols-1"}>
            {deck}
            {panelOpen ? (
              <ScrollFade maxHeight={COLUMN_HEIGHT} className="flex flex-col gap-6 pr-2">
                {algorithm}
                {context}
              </ScrollFade>
            ) : null}
          </div>
        ) : (
          <>
            {deck}
            <ResponsiveDialog open={panelOpen} onOpenChange={setPanelOpen} title={t("algorithm.title")}>
              <div className="flex flex-col gap-6">
                {algorithm}
                {context}
              </div>
            </ResponsiveDialog>
          </>
        )}
      </div>
    </AdmissionShell>
  )
}
