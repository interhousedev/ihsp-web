"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, ResponsiveDialog, StateView } from "@ihsp/ui"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react"
import { toast } from "sonner"
import { SwipeDeck, type SwipeDirection } from "../../../components/lib/swipe-deck"
import type { AdmissionMatch as Match } from "@ihsp/api"
import { useDecide, useMatches, useUndoDecision } from "../hooks"
import { DeckSettings } from "./deck-settings"
import { MatchCard } from "./match-card"
import { SwipeExplainer } from "./swipe-explainer"
import { UniChatPanel } from "./uni-chat-panel"

/** The assistant sits beside the deck from 1024px; narrower it opens in a dialog. */
function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange)
  return () => window.removeEventListener("resize", onChange)
}
const snapshot = () => window.innerWidth >= 1024
const serverSnapshot = () => true

type Decided = { match: Match; direction: SwipeDirection }


/** The Kollegio-style matching feed, embedded in the chooser (no page chrome): settings, swipe deck and assistant context. */
export function DiscoverPage({ lead, tray }: { lead?: ReactNode; tray?: ReactNode }) {
  const t = useT("discover")
  const tChat = useT("uniChat")
  const errorMessage = useErrorMessage()
  const client = useQueryClient()
  const wide = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const matches = useMatches()
  const decide = useDecide()
  const undo = useUndoDecision()
  const [history, setHistory] = useState<Decided[]>([])
  const [stamp, setStamp] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

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
  const context = <UniChatPanel match={top} />

  const deck = matches.isLoading ? (
    <StateView state="loading" rows={4} />
  ) : matches.isError ? (
    <StateView state="error" error={matches.error} onRetry={() => void matches.refetch()} />
  ) : (
    <div className="mx-auto flex w-full min-w-0 max-w-md flex-col gap-4">
      <div className="rounded-card relative isolate z-0 min-w-0 overflow-hidden">
        <SwipeDeck
          className="h-[min(34rem,calc(100dvh-28.5rem))] min-h-[16rem] md:h-[min(34rem,calc(100dvh-26.5rem))] md:min-h-[20rem]"
          items={remaining}
          getKey={(match) => match.university_id}
          getExitDirection={(match) => history.find((entry) => entry.match.university_id === match.university_id)?.direction}
          renderCard={(match) => <MatchCard match={match} />}
          onSwipe={onSwipe}
          rightStamp={t("stamp.interested")}
          leftStamp={t("stamp.notMyVibe")}
          label={t("deck.label")}
          empty={<StateView state="empty" title={t("empty.title")} description={t("empty.text")} />}
        />
      </div>
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
      <SwipeExplainer />
    </div>
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">{lead}</div>
        <div className="flex items-center gap-2">
        {wide ? null : (
          <Button type="button" variant="outline" size="sm" onClick={() => setChatOpen(true)}>
            <Icons.sparkles aria-hidden />
            {tChat("ask")}
          </Button>
        )}
        <DeckSettings onSaved={refresh} />
        </div>
      </div>
      {wide ? (
        <div className="grid grid-cols-[minmax(0,1fr)_24rem] items-start gap-6">
          {deck}
          <aside data-testid="discover-side-slot" className="relative z-10 flex min-w-0 flex-col gap-4">
            {tray}
            {context}
          </aside>
        </div>
      ) : (
        <>
          {deck}
          {tray}
          <ResponsiveDialog open={chatOpen} onOpenChange={setChatOpen} title={tChat("tab")}>
            {context}
          </ResponsiveDialog>
        </>
      )}
    </div>
  )
}
