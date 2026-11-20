"use client"

import { useT } from "@ihsp/i18n"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { FlowStepper, type FlowStepperItem } from "../../../components/lib/flow-stepper"
import { useEssays } from "../api"
import { usePracticeToday, usePromptMap } from "./api"
import { DeepReadStep } from "./deep-read-step"
import { GalleryStep } from "./gallery-step"
import { IdeasStep } from "./ideas-step"
import { MatchStep } from "./match-step"
import { PracticeStep } from "./practice-step"
import { PromptMapStep } from "./prompt-map-step"
import { FLOW_STEP_IDS, stepFromParams, type FlowStepId } from "./steps"

const FURTHEST_KEY = "ihsp.essays.furthest"

/** How far the student has walked, kept on this device; a step past it stays closed until the one before is done. */
function useFurthest(current: FlowStepId) {
  const [stored, setStored] = useState(0)
  const index = FLOW_STEP_IDS.indexOf(current)
  useEffect(() => {
    const saved = Number(window.localStorage.getItem(FURTHEST_KEY) ?? 0)
    const next = Math.max(saved, index)
    setStored(next)
    if (next !== saved) window.localStorage.setItem(FURTHEST_KEY, String(next))
  }, [index])
  return Math.max(stored, index)
}

/** The six steps of the essays section as one linear path: the prompts, daily practice, ideas and drafts, other essays, evaluation, matching. */
export function EssayFlow() {
  const t = useT("essayFlow")
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const current = stepFromParams(params.get("step"), params.get("tab"))
  const furthest = useFurthest(current)
  const map = usePromptMap()
  const today = usePracticeToday()
  const essays = useEssays()

  const go = (id: FlowStepId) => {
    const next = new URLSearchParams(params.toString())
    next.delete("tab")
    next.set("step", id)
    router.replace(`${pathname}?${next.toString()}`)
  }
  const nextOf = (id: FlowStepId) => {
    const target = FLOW_STEP_IDS[FLOW_STEP_IDS.indexOf(id) + 1]
    return target ? () => go(target) : undefined
  }
  const content: Record<FlowStepId, ReactNode> = {
    map: <PromptMapStep onNext={nextOf("map")} />,
    practice: <PracticeStep onNext={nextOf("practice")} />,
    ideas: <IdeasStep onNext={nextOf("ideas")} />,
    gallery: <GalleryStep onNext={nextOf("gallery")} />,
    deep: <DeepReadStep onNext={nextOf("deep")} />,
    match: <MatchStep onNext={nextOf("match")} />,
  }
  const groups = map.data?.groups ?? []
  const summaries: Record<FlowStepId, ReactNode> = {
    map: map.data
      ? t("steps.map.summary", { groups: groups.length, covered: groups.filter((g) => g.covered).length })
      : t("steps.map.hint"),
    practice: today.data?.entry?.body
      ? t("steps.practice.summary", { count: today.data.entry.word_count })
      : t("steps.practice.hint"),
    ideas: essays.data ? t("steps.ideas.summary", { count: essays.data.items.length }) : t("steps.ideas.hint"),
    gallery: t("steps.gallery.hint"),
    deep: t("steps.deep.hint"),
    match: t("steps.match.hint"),
  }
  const items: FlowStepperItem[] = FLOW_STEP_IDS.map((id, index) => {
    const locked = index > furthest
    const status = locked ? "locked" : id === current ? "current" : index < furthest ? "done" : "current"
    return {
      id,
      number: index + 1,
      title: t(`steps.${id}.title`),
      summary: locked ? t("locked", { step: t(`steps.${FLOW_STEP_IDS[index - 1] ?? "map"}.title`) }) : summaries[id],
      status,
      statusLabel: t(`status.${status}`),
      open: id === current,
      content: id === current ? content[id] : undefined,
    }
  })
  return <FlowStepper items={items} label={t("label")} onSelect={(id) => go(id as FlowStepId)} />
}
