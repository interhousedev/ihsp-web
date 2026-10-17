"use client"

import { useT } from "@ihsp/i18n"
import { Field, FieldError, FieldLabel, Input, NativeSelect, NativeSelectOption, Textarea } from "@ihsp/ui"
import type { CourseDraft, CourseLanguage, CourseLevel } from "@ihsp/api"
import { MarkdownEditor } from "../../step-editor/components/markdown-editor"
import type { SettingsForm } from "../hooks/use-settings-form"
import { LIST_LIMITS, SUMMARY_MAX } from "../utils/validate"
import { AccentPicker } from "./accent-picker"
import { BANNER_ASPECTS, CARD_ASPECTS, ImageCropField } from "./image-crop-field"
import { ListEditor } from "./list-editor"

const LEVELS: CourseLevel[] = ["beginner", "intermediate", "advanced"]
const LANGUAGES: CourseLanguage[] = ["uz", "ru", "en"]

function numberOrNull(text: string): number | null {
  if (text.trim() === "") return null
  return Number(text)
}

/** Card image, banner, accent, names, summary, description, facts and the lists of the landing page. */
export function DetailsTab({
  form,
  draft,
  title,
  description,
  onTitle,
  onDescription,
}: {
  form: SettingsForm
  draft: CourseDraft
  title: string
  description: string
  onTitle: (value: string) => void
  onDescription: (value: string) => void
}) {
  const t = useT("courseSettings")
  const values = form.values
  if (!values) return null
  const { update, errors } = form
  const err = (key: keyof typeof errors) => (errors[key] ? t(`errors.${errors[key]}`) : undefined)
  const summaryLength = (values.summary ?? "").length
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <ImageCropField
          label={t("cardImage")}
          aspects={CARD_ASPECTS}
          fileId={values.cover_file_id}
          outWidth={960}
          onChange={(id) => update({ cover_file_id: id })}
        />
        <ImageCropField
          label={t("banner")}
          aspects={BANNER_ASPECTS}
          fileId={values.banner_file_id}
          outWidth={1600}
          onChange={(id) => update({ banner_file_id: id })}
        />
      </div>
      <AccentPicker
        value={values.accent_color}
        onChange={(hex) => update({ accent_color: hex })}
        invalid={errors.accent_color !== undefined}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="settings-title">{t("name")}</FieldLabel>
          <Input
            id="settings-title"
            value={title}
            maxLength={200}
            onChange={(e) => onTitle(e.target.value)}
            className="h-11 md:h-8"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="settings-code">{t("code")}</FieldLabel>
          <Input
            id="settings-code"
            value={values.code ?? ""}
            maxLength={32}
            onChange={(e) => update({ code: e.target.value || null })}
            className="h-11 md:h-8"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="settings-friendly">{t("friendlyName")}</FieldLabel>
          <Input
            id="settings-friendly"
            value={values.friendly_name ?? ""}
            maxLength={80}
            onChange={(e) => update({ friendly_name: e.target.value || null })}
            className="h-11 md:h-8"
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="settings-summary">
          {t("summary")}{" "}
          <span className="text-muted-foreground font-normal" data-testid="summary-counter">
            {summaryLength}/{SUMMARY_MAX}
          </span>
        </FieldLabel>
        <Textarea
          id="settings-summary"
          value={values.summary ?? ""}
          rows={3}
          aria-invalid={errors.summary !== undefined}
          onChange={(e) => update({ summary: e.target.value || null })}
        />
        {errors.summary ? <FieldError>{err("summary")}</FieldError> : null}
      </Field>
      <MarkdownEditor key={draft.id} value={description} onChange={onDescription} label={t("description")} rows={8} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="settings-language">{t("language")}</FieldLabel>
          <NativeSelect
            id="settings-language"
            value={values.language}
            onChange={(e) => update({ language: e.target.value as CourseLanguage })}
            className="w-full"
          >
            {LANGUAGES.map((code) => (
              <NativeSelectOption key={code} value={code}>
                {t(`languages.${code}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="settings-level">{t("level")}</FieldLabel>
          <NativeSelect
            id="settings-level"
            value={values.level ?? ""}
            onChange={(e) => update({ level: (e.target.value || null) as CourseLevel | null })}
            className="w-full"
          >
            <NativeSelectOption value="">{t("levels.none")}</NativeSelectOption>
            {LEVELS.map((level) => (
              <NativeSelectOption key={level} value={level}>
                {t(`levels.${level}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="settings-workload">{t("workload")}</FieldLabel>
          <Input
            id="settings-workload"
            type="number"
            inputMode="numeric"
            min={1}
            max={40}
            value={values.workload_hours_per_week ?? ""}
            aria-invalid={errors.workload_hours_per_week !== undefined}
            onChange={(e) => update({ workload_hours_per_week: numberOrNull(e.target.value) })}
            className="h-11 md:h-8"
          />
          {errors.workload_hours_per_week ? <FieldError>{t("errors.range", { min: 1, max: 40 })}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="settings-duration">{t("duration")}</FieldLabel>
          <Input
            id="settings-duration"
            type="number"
            inputMode="numeric"
            min={1}
            max={52}
            value={values.duration_weeks ?? ""}
            aria-invalid={errors.duration_weeks !== undefined}
            onChange={(e) => update({ duration_weeks: numberOrNull(e.target.value) })}
            className="h-11 md:h-8"
          />
          {errors.duration_weeks ? <FieldError>{t("errors.range", { min: 1, max: 52 })}</FieldError> : null}
        </Field>
      </div>
      <ListEditor
        chips
        label={t("tags")}
        items={values.tags}
        onChange={(tags) => update({ tags })}
        max={LIST_LIMITS.tags[0]}
        maxLength={LIST_LIMITS.tags[1]}
      />
      <ListEditor
        label={t("outcomes")}
        items={values.outcomes}
        onChange={(outcomes) => update({ outcomes })}
        max={LIST_LIMITS.outcomes[0]}
        maxLength={LIST_LIMITS.outcomes[1]}
      />
      <ListEditor
        label={t("requirements")}
        items={values.requirements}
        onChange={(requirements) => update({ requirements })}
        max={LIST_LIMITS.requirements[0]}
        maxLength={LIST_LIMITS.requirements[1]}
      />
      <ListEditor
        label={t("audience")}
        items={values.audience}
        onChange={(audience) => update({ audience })}
        max={LIST_LIMITS.audience[0]}
        maxLength={LIST_LIMITS.audience[1]}
      />
    </div>
  )
}
