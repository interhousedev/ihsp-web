"use client"

import type { UserPreferences, UserPreferencesPatch } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PreferenceSwitch } from "./preference-switch"
import { ThresholdField } from "./threshold-field"

/** Drop alerts and optional thresholds (BOT-12): GPA, semester mark and single mark below a value. */
export function AlertsSection({
  preferences,
  onChange,
}: {
  preferences: UserPreferences
  onChange: (patch: UserPreferencesPatch) => void
}) {
  const t = useT("notificationSettings")
  return (
    <section aria-labelledby="ns-alerts" className="flex flex-col gap-2">
      <h3 id="ns-alerts" className="text-base font-semibold">
        {t("alerts.title")}
      </h3>
      <PreferenceSwitch
        label={t("alerts.drops")}
        description={t("alerts.dropsHint")}
        checked={preferences.alerts_drops}
        onCheckedChange={(value) => onChange({ alerts_drops: value })}
      />
      <ThresholdField
        label={t("alerts.gpaBelow")}
        value={preferences.alerts_gpa_below}
        defaultValue={3.5}
        min={2}
        max={5}
        step={0.1}
        onChange={(value) => onChange({ alerts_gpa_below: value })}
      />
      <ThresholdField
        label={t("alerts.semesterMarkBelow")}
        value={preferences.alerts_semester_mark_below}
        defaultValue={3}
        min={2}
        max={5}
        step={0.1}
        onChange={(value) => onChange({ alerts_semester_mark_below: value })}
      />
      <ThresholdField
        label={t("alerts.markBelow")}
        value={preferences.alerts_mark_below}
        defaultValue={3}
        min={2}
        max={5}
        step={1}
        onChange={(value) => onChange({ alerts_mark_below: value })}
      />
    </section>
  )
}
