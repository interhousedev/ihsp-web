"use client"

import { patchAdminSubject, postAdminSubjects, type Subject } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@ihsp/ui"
import { useEffect, useState } from "react"
import { CheckField } from "../../shared/components/check-field"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

type FormState = { uz: string; ru: string; en: string; short: string; emis: string; divided: boolean }

function fromSubject(subject: Subject | null): FormState {
  return {
    uz: subject?.name.uz ?? "",
    ru: subject?.name.ru ?? "",
    en: subject?.name.en ?? "",
    short: subject?.short_name ?? "",
    emis: subject?.emis_subject_id ? String(subject.emis_subject_id) : "",
    divided: subject?.can_be_divided ?? false,
  }
}

/** Create a subject that is not in EMIS, or edit names, the EMIS link and "can be divided" (ADM-7). `subject` null creates. */
export function SubjectDialog({
  subject,
  open,
  onOpenChange,
}: {
  subject: Subject | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("subjects.dialog")
  const [form, setForm] = useState<FormState>(fromSubject(subject))

  useEffect(() => {
    if (open) setForm(fromSubject(subject))
  }, [open, subject])

  const save = useAdminMutation({
    mutationFn: () => {
      const emis = Number.parseInt(form.emis, 10)
      const body = {
        name: { uz: form.uz.trim(), ru: form.ru.trim(), en: form.en.trim() },
        short_name: form.short.trim() || undefined,
        emis_subject_id: Number.isFinite(emis) ? emis : undefined,
        can_be_divided: form.divided,
      }
      return subject ? patchAdminSubject(subject.id, body) : postAdminSubjects(body)
    },
    invalidate: [["admin", "subjects"]],
    success: subject ? t("saved") : t("created"),
    onSuccess: () => onOpenChange(false),
  })

  const valid = form.uz.trim() !== "" && form.ru.trim() !== "" && form.en.trim() !== ""
  const set = (field: keyof FormState) => (value: string) => setForm((current) => ({ ...current, [field]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (valid) save.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{subject ? t("editTitle") : t("createTitle")}</DialogTitle>
          </DialogHeader>
          <LabeledField label={t("nameUz")} htmlFor="subject-uz" required>
            <Input
              id="subject-uz"
              value={form.uz}
              className={TOUCH}
              onChange={(event) => set("uz")(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("nameRu")} htmlFor="subject-ru" required>
            <Input
              id="subject-ru"
              value={form.ru}
              className={TOUCH}
              onChange={(event) => set("ru")(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("nameEn")} htmlFor="subject-en" required>
            <Input
              id="subject-en"
              value={form.en}
              className={TOUCH}
              onChange={(event) => set("en")(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("shortName")} htmlFor="subject-short">
            <Input
              id="subject-short"
              value={form.short}
              maxLength={16}
              className={TOUCH}
              onChange={(event) => set("short")(event.target.value)}
            />
          </LabeledField>
          <LabeledField label={t("emisId")} htmlFor="subject-emis">
            <Input
              id="subject-emis"
              inputMode="numeric"
              value={form.emis}
              className={TOUCH}
              onChange={(event) => set("emis")(event.target.value.replace(/\D/g, ""))}
            />
          </LabeledField>
          <CheckField
            checked={form.divided}
            label={t("canBeDivided")}
            onChange={(checked) => setForm((current) => ({ ...current, divided: checked }))}
          />
          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={!valid || save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
