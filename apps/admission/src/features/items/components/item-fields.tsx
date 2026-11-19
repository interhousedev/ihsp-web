"use client"

import { useT } from "@ihsp/i18n"
import { Input, Label, Textarea } from "@ihsp/ui"
import {
  ACTIVITY_CATEGORIES,
  type Item,
  type ItemGrade,
  type ItemInput,
  type ItemKind,
  type ItemStatus,
  type ItemTiming,
} from "../api"
import { useAdmissionConfig } from "../../../lib/config"

/** Limits of the backend: title 60, description 150 (honors 100). */
export const LIMITS = { title: 60, organization: 100, activityDescription: 150, honorDescription: 100 } as const
/** Grade level 13 is "post-graduate". */
export const POST_GRAD = 13

export type FormState = {
  status: ItemStatus
  title: string
  organization: string
  description: string
  category: string
  grades: ItemGrade[]
  timing: ItemTiming[]
  hours: string
  weeks: string
  intend: "" | "yes" | "no"
}

export const emptyForm: FormState = {
  status: "draft",
  title: "",
  organization: "",
  description: "",
  category: "",
  grades: [],
  timing: [],
  hours: "",
  weeks: "",
  intend: "",
}

export const toForm = (item: Item): FormState => ({
  status: item.status as ItemStatus,
  title: item.title,
  organization: item.organization,
  description: item.description,
  category: item.category ?? "",
  grades: item.grades as ItemGrade[],
  timing: item.timing as ItemTiming[],
  hours: item.hours_per_week?.toString() ?? "",
  weeks: item.weeks_per_year?.toString() ?? "",
  intend: item.intend_in_college === null ? "" : item.intend_in_college ? "yes" : "no",
})

const num = (v: string) => (v.trim() === "" ? null : Number(v))

export const descriptionMax = (kind: ItemKind) =>
  kind === "honor" ? LIMITS.honorDescription : LIMITS.activityDescription

/** Drafts only need a title and valid numbers; completeness is judged by the backend. */
export function formValid(f: FormState): boolean {
  const hours = num(f.hours)
  const weeks = num(f.weeks)
  return (
    f.title.trim().length > 0 &&
    (hours === null || (Number.isInteger(hours) && hours >= 0 && hours <= 168)) &&
    (weeks === null || (Number.isInteger(weeks) && weeks >= 0 && weeks <= 52))
  )
}

export function toInput(f: FormState): Omit<ItemInput, "kind"> {
  return {
    status: f.status,
    title: f.title.trim(),
    organization: f.organization.trim(),
    description: f.description.trim(),
    category: f.category.trim() || null,
    grades: f.grades,
    timing: f.timing,
    hours_per_week: num(f.hours),
    weeks_per_year: num(f.weeks),
    intend_in_college: f.intend === "" ? null : f.intend === "yes",
  }
}

const optionList = (options: unknown, key: string): string[] => {
  const list = (options as Record<string, unknown> | undefined)?.[key]
  return Array.isArray(list) ? (list as string[]) : []
}

/** The fields of an activity or honor. Common App texts stay English; `errors` are the backend's missing field names. */
export function ItemFields({
  kind,
  value,
  onChange,
  idPrefix,
  errors = [],
}: {
  kind: ItemKind
  value: FormState
  onChange: (next: FormState) => void
  idPrefix: string
  errors?: string[]
}) {
  const t = useT("items")
  const options = useAdmissionConfig().data?.options
  const configured = optionList(options, kind === "honor" ? "recognition_levels" : "activity_categories")
  const categories = configured.length > 0 ? configured : kind === "honor" ? [] : [...ACTIVITY_CATEGORIES]
  const grades = optionList(options, "item_grades").map(Number) as ItemGrade[]
  const timings = optionList(options, "activity_timing") as ItemTiming[]
  const set = (patch: Partial<FormState>) => onChange({ ...value, ...patch })
  const counter = (text: string, max: number) => (
    <span className="text-muted-foreground text-xs tabular-nums" aria-live="off">
      {text.length}/{max}
    </span>
  )
  const err = (field: string) =>
    errors.includes(field) ? (
      <span role="alert" className="text-destructive text-xs">
        {t("form.required")}
      </span>
    ) : null
  const toggle = <T,>(list: T[], v: T, on: boolean) => (on ? [...list, v] : list.filter((x) => x !== v))
  const activity = kind === "activity"
  const dMax = descriptionMax(kind)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">{t("form.english")}</p>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">{t("form.status")}</legend>
        <div className="flex flex-wrap gap-4">
          {(["draft", "ready"] as const).map((s) => (
            <label key={s} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
              <input
                type="radio"
                name={`${idPrefix}-status`}
                className="size-5 md:size-4"
                checked={value.status === s}
                onChange={() => set({ status: s })}
              />
              {t(`status.${s}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-category`}>{t(activity ? "form.activityType" : "form.recognition")}</Label>
        <select
          id={`${idPrefix}-category`}
          className="border-input bg-background min-h-11 rounded-md border px-2 text-sm md:min-h-9"
          value={value.category}
          onChange={(e) => set({ category: e.target.value })}
        >
          <option value="">{t("form.choose")}</option>
          {value.category && !categories.includes(value.category) ? (
            <option value={value.category}>{value.category}</option>
          ) : null}
          {categories.map((c) => (
            <option key={c} value={c}>
              {activity ? t(`category.${c}`) : t(`recognition.${c}`)}
            </option>
          ))}
        </select>
        {err("category")}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-title`}>{t("form.title")}</Label>
        <Input
          id={`${idPrefix}-title`}
          maxLength={LIMITS.title}
          value={value.title ?? ""}
          onChange={(e) => set({ title: e.target.value })}
        />
        {counter(value.title, LIMITS.title)}
        {err("title")}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-org`}>{t("form.organization")}</Label>
        <Input
          id={`${idPrefix}-org`}
          maxLength={LIMITS.organization}
          value={value.organization ?? ""}
          onChange={(e) => set({ organization: e.target.value })}
        />
        {counter(value.organization, LIMITS.organization)}
        {err("organization")}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-desc`}>{t("form.description")}</Label>
        <Textarea
          id={`${idPrefix}-desc`}
          rows={3}
          maxLength={dMax}
          value={value.description ?? ""}
          onChange={(e) => set({ description: e.target.value })}
        />
        {counter(value.description, dMax)}
        {err("description")}
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">{t("form.grades")}</legend>
        <div className="flex flex-wrap gap-3">
          {grades.map((g) => (
            <label key={g} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
              <input
                type="checkbox"
                className="size-5 md:size-4"
                checked={value.grades.includes(g)}
                onChange={(e) => set({ grades: toggle(value.grades, g, e.target.checked).sort((a, b) => a - b) })}
              />
              {g === POST_GRAD ? t("form.postGrad") : g}
            </label>
          ))}
        </div>
        {err("grades")}
      </fieldset>
      {activity ? (
        <>
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-medium">{t("form.timing")}</legend>
            <div className="flex flex-wrap gap-3">
              {timings.map((tm) => (
                <label key={tm} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                  <input
                    type="checkbox"
                    className="size-5 md:size-4"
                    checked={value.timing.includes(tm)}
                    onChange={(e) => set({ timing: toggle(value.timing, tm, e.target.checked) })}
                  />
                  {t(`timing.${tm}`)}
                </label>
              ))}
            </div>
            {err("timing")}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${idPrefix}-hours`}>{t("form.hours")}</Label>
              <Input
                id={`${idPrefix}-hours`}
                inputMode="numeric"
                value={value.hours ?? ""}
                onChange={(e) => set({ hours: e.target.value })}
              />
              {err("hours_per_week")}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${idPrefix}-weeks`}>{t("form.weeks")}</Label>
              <Input
                id={`${idPrefix}-weeks`}
                inputMode="numeric"
                value={value.weeks ?? ""}
                onChange={(e) => set({ weeks: e.target.value })}
              />
              {err("weeks_per_year")}
            </div>
          </div>
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-medium">{t("form.intend")}</legend>
            <div className="flex flex-wrap gap-4">
              {(["yes", "no"] as const).map((v) => (
                <label key={v} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                  <input
                    type="radio"
                    name={`${idPrefix}-intend`}
                    className="size-5 md:size-4"
                    checked={value.intend === v}
                    onChange={() => set({ intend: v })}
                  />
                  {t(`form.${v}`)}
                </label>
              ))}
            </div>
            {err("intend_in_college")}
          </fieldset>
        </>
      ) : null}
    </div>
  )
}
