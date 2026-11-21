"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons, Skeleton } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { useFitPreferences, useSaveFitPreferences } from "../../fit/api"
import { METRIC_IDS, METRIC_STYLE } from "../../fit/fit-model"
import {
  clampRating,
  DEFAULT_RATINGS,
  RATING_MAX,
  RATING_MIN,
  ratingsToWeights,
  sameRatings,
  topTraits,
  TRAIT_AXIS,
  TRAITS,
  type Ratings,
  type TraitId,
} from "../weights-model"
import { RadarPicker } from "./radar-picker"

const SAVE_DELAY_MS = 700

/** One trait as a row: a dot in the colour of the fit axis it feeds, a name and a 44px minus / value / plus stepper. */
function TraitRow({ trait, value, onSet }: { trait: TraitId; value: number; onSet: (value: number) => void }) {
  const t = useT("weightsLab")
  const name = t(`trait.${trait}`)
  return (
    <li className="flex min-h-11 items-center gap-2.5">
      <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: METRIC_STYLE[TRAIT_AXIS[trait]].color }} />
      <span className="min-w-0 flex-1 text-sm">{name}</span>
      <div className="flex items-center">
        <button
          type="button"
          aria-label={t("stepper.down", { trait: name })}
          disabled={value <= RATING_MIN}
          onClick={() => onSet(value - 1)}
          className="hover:bg-muted focus-visible:ring-ring flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 disabled:opacity-30"
        >
          <Icons.minus aria-hidden className="size-4" />
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={t("stepper.up", { trait: name })}
          disabled={value >= RATING_MAX}
          onClick={() => onSet(value + 1)}
          className="hover:bg-muted focus-visible:ring-ring flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 disabled:opacity-30"
        >
          <Icons.add aria-hidden className="size-4" />
        </button>
      </div>
    </li>
  )
}

/** "What matters": the radar and a stepper list bound to GET/PUT /me/fit-preferences. Edits save after a short pause; the list re-ranks on save. */
export function WeightsEditor() {
  const t = useT("weightsLab")
  const tf = useT("fit")
  const prefs = useFitPreferences()
  const save = useSaveFitPreferences()
  const [draft, setDraft] = useState<Ratings | null>(null)
  const saved = prefs.data?.ratings
  const value = draft ?? saved ?? DEFAULT_RATINGS
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { mutate } = save

  useEffect(() => () => clearTimeout(timer.current), [])

  const change = (next: Ratings) => {
    setDraft(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => mutate(next, { onSuccess: () => setDraft(null) }), SAVE_DELAY_MS)
  }

  if (prefs.isPending) return <Skeleton className="h-72 w-full" />
  if (prefs.isError) return <p role="alert" className="text-destructive text-sm">{t("error")}</p>

  const top = topTraits(value)
  const dirty = draft !== null && !sameRatings(draft, saved ?? DEFAULT_RATINGS)
  const status = save.isError ? t("saveError") : save.isPending || dirty ? t("saving") : save.isSuccess ? t("saved") : ""
  const weights = ratingsToWeights(value)
  const nowList = METRIC_IDS.map((id) => `${tf(`metric.${id}.name`)} ${Math.round(weights[id] * 100)}%`).join(" · ")
  return (
    <div className="grid items-center gap-3 lg:grid-cols-2 lg:gap-6">
      <RadarPicker value={value} onChange={change} />
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col divide-y">
          {TRAITS.map((trait) => (
            <TraitRow key={trait} trait={trait} value={value[trait]} onSet={(next) => change({ ...value, [trait]: clampRating(next) })} />
          ))}
        </ul>
        <p className="text-sm">
          <span className="text-muted-foreground">{t("now")}: </span>
          <span className="font-medium">{nowList}</span>
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p aria-live="polite" className={cn("min-w-0 text-sm font-medium")}>
            {top.length === 0 ? t("balanced") : t("lead", { list: top.map((trait) => t(`word.${trait}`)).join(` ${t("and")} `) })}
            {status ? <span className={save.isError ? "text-destructive ml-2 font-normal" : "text-muted-foreground ml-2 font-normal"}>{status}</span> : null}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => change({ ...DEFAULT_RATINGS })}>
            {t("radar.reset")}
          </Button>
        </div>
      </div>
    </div>
  )
}
