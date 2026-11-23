"use client"

import type { UserPreferences } from "@ihsp/api"
import { usePreferences, useUpdatePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { ChoiceCard, ChoiceCardGroup, Switch } from "@ihsp/ui"
import { useState } from "react"
import { SKINS, SOUND_STORAGE_KEY } from "./skin"
import { SkinPreview } from "./skin-preview"
import { useSkin } from "./skin-provider"

type Nudge = UserPreferences["lms_nudges"][number]
const NUDGES: readonly Nudge[] = ["lms_review_due", "lms_streak_at_risk", "lms_deadline_soon"]

/** The own-profile settings: Appearance (skin, sound) and Reminders in Telegram. */
export function ProfileSettings() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-10 md:px-6">
      <AppearanceSection />
      <RemindersSection />
    </div>
  )
}

function readSound(): boolean {
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) === "on"
  } catch {
    return false
  }
}

function AppearanceSection() {
  const t = useT("skin")
  const { skin, setSkin } = useSkin()
  const [sound, setSound] = useState(readSound)
  const toggleSound = (on: boolean) => {
    setSound(on)
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, on ? "on" : "off")
    } catch {
      // Private mode: the switch lasts for this visit.
    }
  }
  return (
    <section id="appearance" aria-labelledby="appearance-title" className="flex scroll-mt-20 flex-col gap-3">
      <h2 id="appearance-title" className="text-lg font-semibold">
        {t("appearance.title")}
      </h2>
      <ChoiceCardGroup legend={t("appearance.skin")} columns={2}>
        {SKINS.map((option) => (
          <ChoiceCard
            key={option}
            name="lms-skin"
            value={option}
            checked={skin === option}
            onChange={() => setSkin(option)}
            data-testid={`appearance-${option}`}
            title={t(`name.${option}`)}
            description={
              <span className="flex flex-col gap-2">
                <span>{t(`hint.${option}`)}</span>
                <SkinPreview skin={option} />
              </span>
            }
          />
        ))}
      </ChoiceCardGroup>
      <label className="flex min-h-11 items-center justify-between gap-3">
        <span className="flex flex-col">
          <span className="font-medium">{t("appearance.sound")}</span>
          <span className="text-muted-foreground text-sm">{t("appearance.soundHint")}</span>
        </span>
        <Switch checked={sound} onCheckedChange={toggleSound} data-testid="appearance-sound" />
      </label>
    </section>
  )
}

function RemindersSection() {
  const t = useT("skin")
  const preferences = usePreferences()
  const { mutate } = useUpdatePreferences()
  if (!preferences) return null
  const enabled = preferences.lms_nudges ?? []
  const toggle = (nudge: Nudge, on: boolean) =>
    mutate({ lms_nudges: on ? [...enabled.filter((n) => n !== nudge), nudge] : enabled.filter((n) => n !== nudge) })
  return (
    <section id="reminders" aria-labelledby="reminders-title" className="flex scroll-mt-20 flex-col gap-3">
      <h2 id="reminders-title" className="text-lg font-semibold">
        {t("reminders.title")}
      </h2>
      <p className="text-muted-foreground text-sm">{t("reminders.hint")}</p>
      <ul className="flex flex-col gap-1">
        {NUDGES.map((nudge) => (
          <li key={nudge}>
            <label className="flex min-h-11 items-center justify-between gap-3">
              <span>{t(`reminders.${nudge}`)}</span>
              <Switch
                checked={enabled.includes(nudge)}
                onCheckedChange={(on) => toggle(nudge, on)}
                data-testid={`nudge-${nudge}`}
              />
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}
