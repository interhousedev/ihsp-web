"use client"

import { keys, patchAdminTerm, postAdminTerms, type Term } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@ihsp/ui"
import { useEffect, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"
import { emptyTermForm, termInput, termToForm, validateTerm, type TermForm } from "../utils/term-form"
import { BellsEditor } from "./bells-editor"
import { DaysEditor } from "./days-editor"

/**
 * Create or edit a term (UF-ADM-05): academic year, half, dates, bell schedule, holidays and moved days.
 * `term` null creates a term that starts from the bells of `template` (the current term).
 */
export function TermEditorDialog({
  term,
  template,
  open,
  onOpenChange,
}: {
  term: Term | null
  template?: Term
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("terms.editor")
  const errorMessage = useErrorMessage()
  const [form, setForm] = useState<TermForm>(() => (term ? termToForm(term) : emptyTermForm(template)))
  const [showIssues, setShowIssues] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(term ? termToForm(term) : emptyTermForm(template))
    setShowIssues(false)
  }, [open, term, template])

  const issues = validateTerm(form)
  const save = useAdminMutation({
    mutationFn: () => (term ? patchAdminTerm(term.id, termInput(form)) : postAdminTerms(termInput(form))),
    invalidate: [keys.admin.terms()],
    success: term ? t("saved") : t("created"),
    onSuccess: () => onOpenChange(false),
    inlineError: true,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <form
          className="grid gap-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (issues.length > 0) {
              setShowIssues(true)
              return
            }
            save.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{term ? t("editTitle", { year: term.academic_year }) : t("createTitle")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField label={t("year")} htmlFor="term-year" description={t("yearHint")} required>
              <Input
                id="term-year"
                value={form.academic_year}
                className={TOUCH}
                onChange={(event) => setForm({ ...form, academic_year: event.target.value })}
              />
            </LabeledField>
            <LabeledField label={t("half")} htmlFor="term-half" required>
              <SelectField
                id="term-half"
                value={String(form.half)}
                options={[
                  { value: "1", label: t("half1") },
                  { value: "2", label: t("half2") },
                ]}
                onChange={(value) => setForm({ ...form, half: value === "2" ? 2 : 1 })}
              />
            </LabeledField>
            <LabeledField label={t("starts")} htmlFor="term-starts" required>
              <DatePicker
                id="term-starts"
                value={form.starts_on}
                onChange={(date) => setForm({ ...form, starts_on: date })}
              />
            </LabeledField>
            <LabeledField label={t("ends")} htmlFor="term-ends" required>
              <DatePicker
                id="term-ends"
                value={form.ends_on}
                min={form.starts_on ?? undefined}
                onChange={(date) => setForm({ ...form, ends_on: date })}
              />
            </LabeledField>
          </div>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{t("bells")}</h3>
            <p className="text-muted-foreground text-xs">{t("bellsHint")}</p>
            <BellsEditor bells={form.bells} onChange={(bells) => setForm({ ...form, bells })} />
          </section>

          <DaysEditor
            nonStudyDays={form.non_study_days}
            movedDays={form.moved_days}
            onNonStudyChange={(days) => setForm({ ...form, non_study_days: days })}
            onMovedChange={(days) => setForm({ ...form, moved_days: days })}
          />

          {showIssues && issues.length > 0 ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                <ul className="list-disc ps-4">
                  {issues.map((issue) => (
                    <li key={issue}>{t(`issues.${issue}`)}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
          {save.isError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{errorMessage(save.error)}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
