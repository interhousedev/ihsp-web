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
import { ideaFitOptions, usePromptMap, type PromptGroup } from "./api"
import { Drafts, NewDraft } from "./drafts"
import { IdeaBank } from "./idea-bank"
import { StepFooter } from "./step-footer"
import { ideasStall } from "./steps"

/** The Life story helper and the word list: offered only here, only when the ideas stall. */
function StallHelper({ fewIdeas }: { fewIdeas: boolean }) {
  const t = useT("essayFlow")
  const [open, setOpen] = useState(false)
  return (
    <section className="bg-warning/10 border-warning/30 rounded-card flex flex-col gap-3 border p-3" data-testid="ideas-stall">
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

/** Step 3: the ideas bank scored against the open prompts, and drafts written for prompt groups. */
export function IdeasStep({ onNext }: { onNext?: () => void }) {
  const t = useT("essayFlow")
  const map = usePromptMap()
  const ideasQuery = useIdeas()
  const consent = useQuery(consentQuery())
  const aiGranted = consent.data?.grants.some((g) => g.purpose === "admission_ai" && g.active) === true
  const ideas = (ideasQuery.data?.items ?? []).filter((i) => i.status !== "drop")
  const fitQueries = useQueries({ queries: ideas.map((i) => ideaFitOptions(i.body, aiGranted)) })
  const fits = Object.fromEntries(ideas.map((idea, i) => [idea.body, { data: fitQueries[i]?.data, pending: fitQueries[i]?.isPending === true && aiGranted }]))
  const scores = fitQueries.flatMap((q) => q.data?.items.map((x) => x.score) ?? [])
  const best = aiGranted && fitQueries.every((q) => !q.isPending) && ideas.length > 0 ? Math.max(0, ...scores) : null
  const [draft, setDraft] = useState<{ key: string; title: string } | null | "blank">(null)
  const groups: PromptGroup[] = map.data?.groups ?? []
  const groupOf = (promptKey: string) => groups.find((g) => g.prompts.some((p) => p.key === promptKey))
  const draftFrom = (group: PromptGroup, idea: string) => setDraft({ key: group.key, title: idea.slice(0, 60) })
  if (map.isError) return <StateView state="error" error={map.error} onRetry={() => void map.refetch()} />
  const stalled = !ideasQuery.isPending && ideasStall(ideas.length, best)
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm">{t("ideas.intro")}</p>
      {stalled ? <StallHelper fewIdeas={ideas.length < 3} /> : null}
      <IdeaBank ideas={ideas} fits={fits} aiGranted={aiGranted} groupOf={groupOf} onDraft={draftFrom} />
      <Drafts>
        {draft ? (
          <NewDraft
            key={draft === "blank" ? "blank" : draft.key}
            groups={groups}
            seed={draft === "blank" ? null : draft}
            onDone={() => setDraft(null)}
          />
        ) : (
          <Button type="button" variant="outline" className="self-start" disabled={groups.length === 0} onClick={() => setDraft("blank")}>
            <Icons.add aria-hidden />
            {t("drafts.new")}
          </Button>
        )}
      </Drafts>
      {!aiGranted && !consent.isPending ? (
        <Link href="/settings/#consent" className="text-primary text-sm underline">
          {t("ideas.fitConsentLink")}
        </Link>
      ) : null}
      <StepFooter next="gallery" onNext={onNext} />
    </div>
  )
}
