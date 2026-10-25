"use client"

import type { ControlName } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, DatePicker, Icons } from "@ihsp/ui"
import { useControlLabel } from "../../shared/hooks/use-control-label"
import { CONTROL_NAMES } from "../../shared/utils/controls"
import { TOUCH } from "../../shared/utils/touch"
import type { ControlForm, ControlIssue } from "../utils/term-form"

/**
 * The weeks of the two midterm controls and the final control of a term (EXAM-1): a first and a last day each, which
 * can be cleared. The calendars only offer days of the term; `issues` holds the problem of each week to show.
 */
export function ControlWeeksEditor({
  value,
  onChange,
  termStart,
  termEnd,
  issues,
}: {
  value: ControlForm
  onChange: (value: ControlForm) => void
  termStart: string | null
  termEnd: string | null
  issues: Partial<Record<ControlName, ControlIssue>>
}) {
  const t = useT("terms.editor.controls")
  const tIssues = useT("terms.editor.issues")
  const label = useControlLabel()

  function change(name: ControlName, part: "start" | "end", date: string | null) {
    onChange({ ...value, [name]: { ...value[name], [part]: date } })
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <ul className="flex flex-col gap-3">
        {CONTROL_NAMES.map((name) => {
          const { start, end } = value[name]
          const issue = issues[name]
          return (
            <li key={name} className="grid gap-2 sm:grid-cols-[8rem_1fr_1fr_auto] sm:items-center">
              <span className="text-sm font-medium">{label(name)}</span>
              <DatePicker
                value={start}
                min={termStart ?? undefined}
                max={termEnd ?? undefined}
                aria-label={t("start", { name: label(name) })}
                onChange={(date) => change(name, "start", date)}
              />
              <DatePicker
                value={end}
                min={termStart ?? undefined}
                max={termEnd ?? undefined}
                aria-label={t("end", { name: label(name) })}
                onChange={(date) => change(name, "end", date)}
              />
              <Button
                type="button"
                variant="ghost"
                className={TOUCH}
                disabled={start === null && end === null}
                aria-label={t("clear", { name: label(name) })}
                onClick={() => onChange({ ...value, [name]: { start: null, end: null } })}
              >
                <Icons.close aria-hidden />
                {t("clearShort")}
              </Button>
              {issue ? <p className="text-destructive text-xs sm:col-span-4">{tIssues(issue)}</p> : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
