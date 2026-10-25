"use client"

import { getMeSubjectsQuery, type UserPreferences, type UserPreferencesPatch } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Checkbox } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { ChoiceGroup } from "./choice-group"
import { PreferenceSwitch } from "./preference-switch"
import { MARK_TYPES, MARK_VALUES, nextSubjectIds, toggleInList } from "./settings-fields"

/** New-mark notifications: on/off, mark types, mark values and the subjects they apply to (BOT-13). */
export function MarksSection({
  preferences,
  onChange,
}: {
  preferences: UserPreferences
  onChange: (patch: UserPreferencesPatch) => void
}) {
  const t = useT("notificationSettings")
  const subjects = useQuery(getMeSubjectsQuery())
  const allIds = subjects.data?.map((card) => card.subject.id) ?? []
  const disabled = !preferences.marks_enabled

  return (
    <section aria-labelledby="ns-marks" className="flex flex-col gap-2">
      <h3 id="ns-marks" className="text-base font-semibold">
        {t("marks.title")}
      </h3>
      <PreferenceSwitch
        label={t("marks.enabled")}
        description={t("marks.enabledHint")}
        checked={preferences.marks_enabled}
        onCheckedChange={(value) => onChange({ marks_enabled: value })}
      />
      <ChoiceGroup
        legend={t("marks.types")}
        disabled={disabled}
        choices={MARK_TYPES.map((value) => ({ value, label: t(`marks.type.${value}`) }))}
        selected={preferences.marks_types}
        onToggle={(value) => onChange({ marks_types: toggleInList(preferences.marks_types, value, MARK_TYPES) })}
      />
      <ChoiceGroup
        legend={t("marks.values")}
        disabled={disabled}
        choices={MARK_VALUES.map((value) => ({ value, label: String(value) }))}
        selected={preferences.marks_values}
        onToggle={(value) => onChange({ marks_values: toggleInList(preferences.marks_values, value, MARK_VALUES) })}
      />
      {subjects.data && subjects.data.length > 0 ? (
        <fieldset className="flex min-w-0 flex-col gap-1" disabled={disabled}>
          <legend className="text-sm font-medium">{t("marks.subjects")}</legend>
          <p className="text-muted-foreground text-xs">
            {preferences.marks_subject_ids === null ? t("marks.allSubjects") : t("marks.someSubjects")}
          </p>
          <div className="flex flex-wrap gap-x-4">
            {subjects.data.map((card) => (
              <label key={card.subject.id} className="flex min-h-11 items-center gap-2 text-sm">
                <Checkbox
                  checked={
                    preferences.marks_subject_ids === null || preferences.marks_subject_ids.includes(card.subject.id)
                  }
                  onCheckedChange={() =>
                    onChange({
                      marks_subject_ids: nextSubjectIds(preferences.marks_subject_ids, allIds, card.subject.id),
                    })
                  }
                />
                <span>{card.subject.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </section>
  )
}
