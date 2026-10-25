"use client"

import type { UserPreferences, UserPreferencesPatch } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Input } from "@ihsp/ui"
import { useEffect, useId, useState } from "react"
import { PreferenceSwitch } from "./preference-switch"
import { parseThreshold } from "./settings-fields"

const MIN_LEAD = 1
const MAX_LEAD = 60

/** Lesson settings (UF-BOT-06): how early the lesson links arrive, and for teachers the end-of-lesson prompt. */
export function LessonsSection({
  preferences,
  showPrompt,
  onChange,
}: {
  preferences: UserPreferences
  /** Teachers only (BOT-16). */
  showPrompt: boolean
  onChange: (patch: UserPreferencesPatch) => void
}) {
  const t = useT("notificationSettings")
  const inputId = useId()
  const [text, setText] = useState(String(preferences.lessons_links_lead_min))

  useEffect(() => {
    setText(String(preferences.lessons_links_lead_min))
  }, [preferences.lessons_links_lead_min])

  function commit() {
    const parsed = parseThreshold(text, MIN_LEAD, MAX_LEAD)
    if (parsed === undefined || !Number.isInteger(parsed)) setText(String(preferences.lessons_links_lead_min))
    else if (parsed !== preferences.lessons_links_lead_min) onChange({ lessons_links_lead_min: parsed })
  }

  return (
    <section aria-labelledby="ns-lessons" className="flex flex-col gap-2">
      <h3 id="ns-lessons" className="text-base font-semibold">
        {t("lessons.title")}
      </h3>
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium">
          {t("lessons.linksLead")}
        </label>
        <div className="flex items-center gap-2">
          <Input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={MIN_LEAD}
            max={MAX_LEAD}
            step={1}
            value={text}
            className="h-11 w-20 md:h-8"
            onChange={(event) => setText(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit()
            }}
          />
          <span className="text-muted-foreground text-sm">{t("lessons.minutes")}</span>
        </div>
      </div>
      {showPrompt ? (
        <PreferenceSwitch
          label={t("lessons.prompt")}
          description={t("lessons.promptHint")}
          checked={preferences.lessons_prompt_enabled}
          onCheckedChange={(value) => onChange({ lessons_prompt_enabled: value })}
        />
      ) : null}
    </section>
  )
}
