"use client"

import { useT } from "@ihsp/i18n"
import { Button, Input, Label, Textarea } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import { VoiceFill, type VoiceFieldSpec } from "@/components/voice-fill/voice-fill"
import { TEAMMATES, type Brief } from "../api"

const LIKES_MAX = 1500
const NOTE_MAX = 300
const NETWORK_MAX = 1000
const HOURS_MIN = 0.25
const HOURS_MAX = 16
const FUTURE_MAX = 1500

export function briefValid(b: Brief): boolean {
  return (
    b.likes.trim().length > 0 &&
    b.hours_per_day >= HOURS_MIN &&
    b.hours_per_day <= HOURS_MAX &&
    b.budget_min_usd >= 0 &&
    b.budget_max_usd >= b.budget_min_usd
  )
}

/** The student's brief: the only input of the idea generator. */
export function BriefForm({
  initial,
  pending,
  onSubmit,
}: {
  initial: Brief
  pending: boolean
  onSubmit: (brief: Brief) => void
}) {
  const t = useT("projects")
  const [brief, setBrief] = useState<Brief>(initial)
  const set = <K extends keyof Brief>(key: K, value: Brief[K]) => setBrief((b) => ({ ...b, [key]: value }))
  const num = (raw: string) => (raw === "" ? 0 : Number(raw))
  const valid = briefValid(brief)
  const specs: VoiceFieldSpec[] = [
    { key: "likes", label: t("form.likes"), max_length: LIKES_MAX },
    { key: "future_interest", label: t("form.future"), max_length: FUTURE_MAX },
    { key: "experience", label: t("form.experience"), max_length: LIKES_MAX },
    { key: "hours_per_day", label: t("form.hours"), kind: "number" },
    { key: "teammates", label: t("form.teammates"), kind: "choice", options: [...TEAMMATES] },
    { key: "teammates_note", label: t("form.teammatesNote"), max_length: NOTE_MAX },
    { key: "network", label: t("form.network"), max_length: NETWORK_MAX },
    { key: "budget_min_usd", label: t("form.budgetMin"), kind: "number" },
    { key: "budget_max_usd", label: t("form.budgetMax"), kind: "number" },
  ]
  const questions = [t("form.likes"), t("form.future"), t("form.experience"), t("form.hours"), t("form.teammates"), t("form.network"), t("form.budget")]
  function fillFrom(values: Record<string, string>) {
    setBrief((b) => {
      const next: Brief = { ...b }
      for (const [key, value] of Object.entries(values)) {
        if (key === "hours_per_day") next.hours_per_day = Math.min(HOURS_MAX, Math.max(HOURS_MIN, Number(value)))
        else if (key === "budget_min_usd" || key === "budget_max_usd") next[key] = Math.max(0, Math.trunc(Number(value)))
        else if (key === "teammates") next.teammates = value as Brief["teammates"]
        else if (key in next) (next as Record<string, unknown>)[key] = value
      }
      return next
    })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (valid && !pending) onSubmit({ ...brief, likes: brief.likes.trim() })
  }

  return (
    <form className="bg-card flex flex-col gap-4 rounded-card border p-4" onSubmit={submit}>
      <VoiceFill form="projects_brief" questions={questions} fields={specs} onFill={fillFrom}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pj-likes">{t("form.likes")}</Label>
        <Textarea
          id="pj-likes"
          rows={3}
          maxLength={LIKES_MAX}
          required
          placeholder={t("form.likesHint")}
          value={brief.likes}
          onChange={(e) => set("likes", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pj-future">{t("form.future")}</Label>
        <Textarea
          id="pj-future"
          rows={2}
          maxLength={FUTURE_MAX}
          placeholder={t("form.futureHint")}
          value={brief.future_interest}
          onChange={(e) => set("future_interest", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pj-experience">{t("form.experience")}</Label>
        <Textarea
          id="pj-experience"
          rows={3}
          maxLength={LIKES_MAX}
          placeholder={t("form.experienceHint")}
          value={brief.experience}
          onChange={(e) => set("experience", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pj-hours">{t("form.hours")}</Label>
        <div className="flex items-center gap-3">
          <input
            aria-hidden
            tabIndex={-1}
            type="range"
            min={HOURS_MIN}
            max={HOURS_MAX}
            step={0.25}
            value={brief.hours_per_day}
            onChange={(e) => set("hours_per_day", num(e.target.value))}
            className="accent-primary h-11 min-w-0 flex-1"
          />
          <Input
            id="pj-hours"
            type="number"
            inputMode="decimal"
            min={HOURS_MIN}
            max={HOURS_MAX}
            step={0.25}
            className="h-11 w-24"
            value={brief.hours_per_day}
            onChange={(e) => set("hours_per_day", num(e.target.value))}
          />
        </div>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("form.teammates")}</legend>
        <div className="flex flex-wrap gap-2">
          {TEAMMATES.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              className="min-h-11"
              variant={brief.teammates === value ? "default" : "outline"}
              aria-pressed={brief.teammates === value}
              onClick={() => set("teammates", value)}
            >
              {t(`form.teammate.${value}`)}
            </Button>
          ))}
        </div>
        <Input
          aria-label={t("form.teammatesNote")}
          placeholder={t("form.teammatesNote")}
          maxLength={NOTE_MAX}
          className="h-11"
          value={brief.teammates_note}
          onChange={(e) => set("teammates_note", e.target.value)}
        />
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pj-network">{t("form.network")}</Label>
        <Textarea
          id="pj-network"
          rows={2}
          maxLength={NETWORK_MAX}
          placeholder={t("form.networkHint")}
          value={brief.network}
          onChange={(e) => set("network", e.target.value)}
        />
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">{t("form.budget")}</legend>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            aria-label={t("form.budgetMin")}
            className="h-11 w-32"
            value={brief.budget_min_usd}
            onChange={(e) => set("budget_min_usd", Math.trunc(num(e.target.value)))}
          />
          <span aria-hidden>–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            aria-label={t("form.budgetMax")}
            className="h-11 w-32"
            value={brief.budget_max_usd}
            onChange={(e) => set("budget_max_usd", Math.trunc(num(e.target.value)))}
          />
          <span className="text-muted-foreground text-sm">USD</span>
        </div>
        {brief.budget_max_usd < brief.budget_min_usd && (
          <p role="alert" className="text-destructive text-xs">
            {t("form.budgetOrder")}
          </p>
        )}
      </fieldset>
      <Button type="submit" className="min-h-11 self-start" disabled={!valid || pending}>
        {t("form.submit")}
      </Button>
      </VoiceFill>
    </form>
  )
}
