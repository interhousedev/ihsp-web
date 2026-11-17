"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Input, Label, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { useAdmissionConfig } from "../../../lib/config"
import { ACTIVITY_CATEGORIES, type ItemGrade, type ItemKind } from "../api"
import { formValid, LIMITS, POST_GRAD, type FormState } from "./item-fields"

const STEPS = 3
const DEFAULT_GRADES: ItemGrade[] = [9, 10, 11, 12, 13] as ItemGrade[]

const Counter = ({ text, max }: { text: string; max: number }) => (
  <span className="text-muted-foreground text-xs tabular-nums">
    {text.length}/{max}
  </span>
)

/**
 * Three steps for a new activity: category, title and description, then organization, grades, hours and weeks.
 * The last step submits the surrounding form; the parent owns the state and the create call.
 */
export function ActivityWizard({
  kind = "activity",
  value,
  onChange,
  onStepChange,
}: {
  kind?: ItemKind
  value: FormState
  onChange: (next: FormState) => void
  onStepChange?: (step: number) => void
}) {
  const t = useT("items")
  const options = useAdmissionConfig().data?.options as Record<string, unknown> | undefined
  const honor = kind === "honor"
  const configured = options?.[honor ? "recognition_levels" : "activity_categories"]
  const categories =
    Array.isArray(configured) && configured.length > 0
      ? (configured as string[])
      : honor
        ? []
        : [...ACTIVITY_CATEGORIES]
  const descriptionMax = honor ? LIMITS.honorDescription : LIMITS.activityDescription
  const configuredGrades = options?.item_grades
  const grades = (Array.isArray(configuredGrades) ? configuredGrades.map(Number) : DEFAULT_GRADES) as ItemGrade[]
  const [step, setStep] = useState(1)
  const set = (patch: Partial<FormState>) => onChange({ ...value, ...patch })
  const go = (next: number) => {
    setStep(next)
    onStepChange?.(next)
  }
  const canNext = step === 1 ? value.category !== "" : step === 2 ? value.title.trim() !== "" : formValid(value)
  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted-foreground text-xs">{t("wizard.step", { n: step, total: STEPS })}</p>
      {step === 1 ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">{t(honor ? "wizard.level" : "wizard.category")}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((c) => (
              <label
                key={c}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm",
                  value.category === c ? "border-primary bg-primary/5" : "border-border",
                )}
              >
                <input
                  type="radio"
                  name="wizard-category"
                  className="size-4"
                  checked={value.category === c}
                  onChange={() => set({ category: c })}
                />
                {honor ? t(`recognition.${c}`) : t(`category.${c}`)}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {step === 2 ? (
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium">{t("wizard.details")}</p>
          <div className="flex flex-col gap-1">
            <Label htmlFor="wizard-title">{t("form.title")}</Label>
            <Input
              id="wizard-title"
              maxLength={LIMITS.title}
              value={value.title}
              onChange={(e) => set({ title: e.target.value })}
            />
            <Counter text={value.title} max={LIMITS.title} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="wizard-desc">{t("form.description")}</Label>
            <Textarea
              id="wizard-desc"
              rows={4}
              maxLength={descriptionMax}
              value={value.description}
              onChange={(e) => set({ description: e.target.value })}
            />
            <Counter text={value.description} max={descriptionMax} />
          </div>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium">{t("wizard.extra")}</p>
          <div className="flex flex-col gap-1">
            <Label htmlFor="wizard-org">{t("form.organization")}</Label>
            <Input
              id="wizard-org"
              maxLength={LIMITS.organization}
              value={value.organization}
              onChange={(e) => set({ organization: e.target.value })}
            />
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
                    onChange={(e) =>
                      set({
                        grades: (e.target.checked ? [...value.grades, g] : value.grades.filter((x) => x !== g)).sort(
                          (a, b) => a - b,
                        ),
                      })
                    }
                  />
                  {g === POST_GRAD ? t("form.postGrad") : g}
                </label>
              ))}
            </div>
          </fieldset>
          {honor ? null : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="wizard-hours">{t("form.hours")}</Label>
                <Input
                  id="wizard-hours"
                  inputMode="numeric"
                  value={value.hours}
                  onChange={(e) => set({ hours: e.target.value })}
                />
                <span className="text-muted-foreground text-xs">{t("wizard.ofHours")}</span>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="wizard-weeks">{t("form.weeks")}</Label>
                <Input
                  id="wizard-weeks"
                  inputMode="numeric"
                  value={value.weeks}
                  onChange={(e) => set({ weeks: e.target.value })}
                />
                <span className="text-muted-foreground text-xs">{t("wizard.ofWeeks")}</span>
              </div>
            </div>
          )}
        </div>
      ) : null}
      <div className="flex justify-between gap-2">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={() => go(step - 1)}>
            {t("wizard.back")}
          </Button>
        ) : (
          <span />
        )}
        {step < STEPS ? (
          <Button type="button" disabled={!canNext} onClick={() => go(step + 1)}>
            {t("wizard.next")}
          </Button>
        ) : (
          <Button type="submit" disabled={!canNext}>
            {t("new.create")}
          </Button>
        )}
      </div>
    </div>
  )
}
