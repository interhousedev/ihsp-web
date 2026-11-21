"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { useState } from "react"
import { pageClass } from "../../../components/lib/page"
import { ScreenSummary } from "../../assistant/screen-context"
import { AdmissionShell } from "../../shell/components/admission-shell"
import {
  CENTRE,
  DEFAULT_RATINGS,
  leadingCorners,
  radarToWeights,
  topTraits,
  triangleToWeights,
  type Bary,
  type Ratings,
} from "../weights-model"
import { RadarPicker } from "./radar-picker"
import { TrianglePicker } from "./triangle-picker"
import { TopUniversities, WeightsSummary } from "./weights-result"

type Mode = "triangle" | "radar"
const MODES: Mode[] = ["triangle", "radar"]

/**
 * Prototype of "what matters to you": two ways (triangle, radar) to set the four fit weights, with the plain-words
 * sentence and a live top five. MOCK: mock universities, nothing is saved. Preview route: /preview/weights.
 */
export function WeightsPage() {
  const t = useT("weightsLab")
  const [mode, setMode] = useState<Mode>("triangle")
  const [bary, setBary] = useState<Bary>(CENTRE)
  const [ratings, setRatings] = useState<Ratings>(DEFAULT_RATINGS)

  const weights = mode === "triangle" ? triangleToWeights(bary) : radarToWeights(ratings)
  const words = mode === "triangle" ? leadingCorners(bary) : topTraits(ratings)
  const names = words.map((word) => t("summary.quote", { x: t(`word.${word}`) }))
  const sentence =
    names.length === 0
      ? t("summary.balanced")
      : t("summary.lead", { list: names.length === 2 ? t("summary.and", { a: names[0]!, b: names[1]! }) : names[0]! })

  return (
    <AdmissionShell>
      <ScreenSummary title={t("title")} summary={`Weights prototype (mock). Mode ${mode}.`} />
      <div className={pageClass("gap-4")}>
        <header className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
            {t("title")}
            <span className="text-muted-foreground rounded-full border border-dashed px-2 py-0.5 text-[11px] leading-4 font-normal tracking-normal">
              {t("mock")}
            </span>
          </h1>
          <p className="text-muted-foreground hidden max-w-prose text-sm sm:block">{t("intro")}</p>
        </header>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-6">
          <div className="bg-card order-2 lg:order-0 lg:row-span-2 rounded-card flex flex-col gap-4 border p-4">
            <div role="group" aria-label={t("tabsLabel")} className="bg-muted flex w-full rounded-full p-0.5 sm:w-fit">
              {MODES.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={mode === id}
                  onClick={() => setMode(id)}
                  className={cn(
                    "focus-visible:ring-ring min-h-9 flex-1 rounded-full px-4 text-sm font-medium outline-none focus-visible:ring-2",
                    mode === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`tabs.${id}`)}
                </button>
              ))}
            </div>
            {mode === "triangle" ? <TrianglePicker value={bary} onChange={setBary} /> : <RadarPicker value={ratings} onChange={setRatings} />}
          </div>
          <WeightsSummary sentence={sentence} weights={weights} className="order-1 lg:order-0" />
          <TopUniversities weights={weights} className="order-3 lg:order-0" />
        </div>
      </div>
    </AdmissionShell>
  )
}
