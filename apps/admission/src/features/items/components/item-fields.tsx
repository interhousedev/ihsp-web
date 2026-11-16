"use client"

import { useT } from "@ihsp/i18n"
import { Input, Label, Textarea } from "@ihsp/ui"
import type { ItemInput } from "../api"

export const LIMITS = { title: 100, organization: 100, description: 150, category: 40 } as const

export type FormState = {
  title: string
  organization: string
  description: string
  category: string
  grades: number[]
  hours: string
  weeks: string
}

export const emptyForm: FormState = {
  title: "",
  organization: "",
  description: "",
  category: "",
  grades: [],
  hours: "",
  weeks: "",
}

const num = (v: string) => (v.trim() === "" ? null : Number(v))

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
    title: f.title.trim(),
    organization: f.organization.trim(),
    description: f.description.trim(),
    category: f.category.trim() || null,
    grades: f.grades,
    hours_per_week: num(f.hours),
    weeks_per_year: num(f.weeks),
  }
}

/** The shared fields of an activity or honor. The Common App texts stay English, whatever the UI language. */
export function ItemFields({
  value,
  onChange,
  idPrefix,
}: {
  value: FormState
  onChange: (next: FormState) => void
  idPrefix: string
}) {
  const t = useT("items")
  const set = (patch: Partial<FormState>) => onChange({ ...value, ...patch })
  const counter = (text: string, max: number) => (
    <span className="text-muted-foreground text-xs tabular-nums" aria-live="off">
      {text.length}/{max}
    </span>
  )
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">{t("form.english")}</p>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-title`}>{t("form.title")}</Label>
        <Input
          id={`${idPrefix}-title`}
          maxLength={LIMITS.title}
          value={value.title}
          onChange={(e) => set({ title: e.target.value })}
        />
        {counter(value.title, LIMITS.title)}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-org`}>{t("form.organization")}</Label>
        <Input
          id={`${idPrefix}-org`}
          maxLength={LIMITS.organization}
          value={value.organization}
          onChange={(e) => set({ organization: e.target.value })}
        />
        {counter(value.organization, LIMITS.organization)}
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${idPrefix}-desc`}>{t("form.description")}</Label>
        <Textarea
          id={`${idPrefix}-desc`}
          rows={3}
          maxLength={LIMITS.description}
          value={value.description}
          onChange={(e) => set({ description: e.target.value })}
        />
        {counter(value.description, LIMITS.description)}
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">{t("form.grades")}</legend>
        <div className="flex flex-wrap gap-3">
          {[9, 10, 11, 12].map((g) => (
            <label key={g} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
              <input
                type="checkbox"
                checked={value.grades.includes(g)}
                onChange={(e) =>
                  set({ grades: e.target.checked ? [...value.grades, g].sort() : value.grades.filter((x) => x !== g) })
                }
              />
              {g}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${idPrefix}-hours`}>{t("form.hours")}</Label>
          <Input
            id={`${idPrefix}-hours`}
            inputMode="numeric"
            value={value.hours}
            onChange={(e) => set({ hours: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${idPrefix}-weeks`}>{t("form.weeks")}</Label>
          <Input
            id={`${idPrefix}-weeks`}
            inputMode="numeric"
            value={value.weeks}
            onChange={(e) => set({ weeks: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
