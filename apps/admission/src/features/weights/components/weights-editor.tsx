"use client"

import { useT } from "@ihsp/i18n"
import { Skeleton } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { useFitPreferences, useSaveFitPreferences } from "../../fit/api"
import { DEFAULT_RATINGS, sameRatings, topTraits, type Ratings } from "../weights-model"
import { RadarPicker } from "./radar-picker"

const SAVE_DELAY_MS = 700

/** "What matters": the radar bound to GET/PUT /me/fit-preferences. Edits save after a short pause; the list re-ranks on save. */
export function WeightsEditor() {
  const t = useT("weightsLab")
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
  return (
    <div className="flex flex-col gap-3">
      <RadarPicker value={value} onChange={change} />
      <p aria-live="polite" className="text-sm font-medium">
        {top.length === 0 ? t("balanced") : t("lead", { list: top.map((trait) => t(`word.${trait}`)).join(` ${t("and")} `) })}
        {status ? <span className={save.isError ? "text-destructive ml-2 font-normal" : "text-muted-foreground ml-2 font-normal"}>{status}</span> : null}
      </p>
    </div>
  )
}
