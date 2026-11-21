"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, StateView } from "@ihsp/ui"
import { useQuery, useQueries } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { consentQuery } from "../../consent/api"
import { WordsBody } from "../../words/components/words-page"
import { useIdeas } from "../api"
import { LifeStory } from "../components/life-story"
import { useStartEssay } from "../ledger/use-start-essay"
import { ideaFitOptions, usePromptMap, type PromptGroup } from "./api"
import { IdeaBank } from "./idea-bank"

/** An idea stalls the page when there are fewer than three, or none fits any open prompt well. */
export const STALL_IDEAS = 3
export const STALL_SCORE = 40

export function ideasStall(ideas: number, bestScore: number | null): boolean {
  return ideas < STALL_IDEAS || (bestScore !== null && bestScore < STALL_SCORE)
}

/** The Life story helper and the word list: offered only here, only when the ideas stall. */
function StallHelper({ fewIdeas }: { fewIdeas: boolean }) {
  const t = useT("essayFlow")
  const [open, setOpen] = useState(false)
  return (
    <section
      className="bg-warning/10 border-warning/30 rounded-card flex flex-col gap-3 border p-3"
      data-testid="ideas-stall"
    >
      <div className="flex flex-col gap-1">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Icons.sparkles aria-hidden className="size-4" />
          {t("ideas.stallTitle")}
        </h3>
        <p className="text-sm">{t(fewIdeas ? "ideas.stallFew" : "ideas.stallWeak")}</p>
      </div>
      {open ? (
        <div className="flex flex-col gap-6">
          <LifeStory />
          <section id="words" className="flex scroll-mt-20 flex-col gap-3">
            <h4 className="font-semibold">{t("ideas.wordsTitle")}</h4>
            <WordsBody />
          </section>
        </div>
      ) : (
        <Button type="button" variant="outline" className="self-start" onClick={() => setOpen(true)}>
          {t("ideas.stallOpen")}
        </Button>
      )}
    </section>
  )
}

/** The ideas bank scored against the prompts still open; an idea can start a draft for the prompt group it fits. */
export function IdeasPanel() {
  const t = useT("essayFlow")
  const map = usePromptMap("all")
  const ideasQuery = useIdeas()
  const consent = useQuery(consentQuery())
  const { start } = useStartEssay()
  const aiGranted = consent.data?.grants.some((g) => g.purpose === "admission_ai" && g.active) === true
  const ideas = (ideasQuery.data?.items ?? []).filter((i) => i.status !== "drop")
  const fitQueries = useQueries({ queries: ideas.map((i) => ideaFitOptions(i.body, aiGranted)) })
  const fits = Object.fromEntries(
    ideas.map((idea, i) => [
      idea.body,
      { data: fitQueries[i]?.data, pending: fitQueries[i]?.isPending === true && aiGranted },
    ]),
  )
  const scores = fitQueries.flatMap((q) => q.data?.items.map((x) => x.score) ?? [])
  const best = aiGranted && fitQueries.every((q) => !q.isPending) && scores.length > 0 ? Math.max(0, ...scores) : null
  const groups: PromptGroup[] = map.data?.groups ?? []
  const groupOf = (promptKey: string) => groups.find((g) => g.prompts.some((p) => p.key === promptKey))
  if (map.isError) return <StateView state="error" error={map.error} onRetry={() => void map.refetch()} />
  const stalled = !ideasQuery.isPending && ideasStall(ideas.length, best)
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm">{t("ideas.intro")}</p>
      {stalled ? <StallHelper fewIdeas={ideas.length < STALL_IDEAS} /> : null}
      <IdeaBank
        ideas={ideas}
        fits={fits}
        aiGranted={aiGranted}
        groupOf={groupOf}
        onDraft={(group, idea) => start(group, idea.slice(0, 60))}
      />
      {!aiGranted && !consent.isPending ? (
        <Link href="/settings/#consent" className="text-primary text-sm underline">
          {t("ideas.fitConsentLink")}
        </Link>
      ) : null}
    </div>
  )
}
