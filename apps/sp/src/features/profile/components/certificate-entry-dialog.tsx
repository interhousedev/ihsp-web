"use client"

import {
  keys,
  patchMyCertificate,
  postMyCertificate,
  type CertificateEntry,
  type CertificateEntryInput,
  type CertificateType,
  type CustomValue,
} from "@ihsp/api"
import { CustomFieldInputs, typeName } from "@ihsp/features-core"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  Dropdown,
} from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

function numberOrNull(text: string): number | null {
  const value = Number(text)
  return text.trim() === "" || Number.isNaN(value) ? null : value
}

/** Form of one certificate entry: only the fields the type asks for (level, score, percent, subject, year). */
export function CertificateEntryDialog({
  type,
  entry,
  onClose,
}: {
  type: CertificateType
  entry: CertificateEntry | null
  onClose: () => void
}) {
  const t = useT("certificates")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [level, setLevel] = useState(entry?.level ?? "")
  const [score, setScore] = useState(entry?.score != null ? String(entry.score) : "")
  const [percent, setPercent] = useState(entry?.percent != null ? String(entry.percent) : "")
  const [subject, setSubject] = useState(entry?.subject ?? "")
  const [year, setYear] = useState(entry?.year != null ? String(entry.year) : "")
  const [custom, setCustom] = useState<Record<string, CustomValue>>(entry?.custom_values ?? {})
  const name = typeName(type, locale)

  const save = useMutation({
    mutationFn: (body: CertificateEntryInput) => (entry ? patchMyCertificate(entry.id, body) : postMyCertificate(body)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.certificates.mine() })
      toast.success(t("saved"))
      onClose()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const customOk = type.custom_fields.every((field) => !field.required || custom[field.key] !== undefined)
  const valid = (!type.asks_level || level !== "") && (!type.asks_score || score.trim() !== "") && customOk
  const submit = () =>
    save.mutate({
      type_id: type.id,
      level: type.asks_level ? level || null : null,
      score: type.asks_score ? numberOrNull(score) : null,
      percent: type.asks_percent ? numberOrNull(percent) : null,
      subject: type.asks_subject ? subject.trim() || null : null,
      year: type.asks_year ? numberOrNull(year) : null,
      custom: type.custom_fields.length > 0 ? custom : null,
    })

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (valid) submit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{entry ? t("editEntry", { type: name }) : t("addEntry", { type: name })}</DialogTitle>
          </DialogHeader>
          {type.asks_level ? (
            <Field>
              <FieldLabel htmlFor="cert-level">{t("level")}</FieldLabel>
              <Dropdown
                id="cert-level"
                value={level}
                onValueChange={setLevel}
                className="w-full"
                options={[
                  { value: "", label: t("chooseLevel") },
                  ...type.levels.map((item) => ({ value: item, label: item })),
                ]}
              />
            </Field>
          ) : null}
          {type.asks_score ? (
            <Field>
              <FieldLabel htmlFor="cert-score">
                {t("score")}
                {type.score_min != null && type.score_max != null
                  ? ` (${t("scoreRange", { min: type.score_min, max: type.score_max })})`
                  : ""}
              </FieldLabel>
              <Input
                id="cert-score"
                type="number"
                inputMode="decimal"
                min={type.score_min ?? undefined}
                max={type.score_max ?? undefined}
                step="any"
                className="h-11 md:h-8"
                value={score}
                onChange={(event) => setScore(event.target.value)}
              />
            </Field>
          ) : null}
          {type.asks_percent ? (
            <Field>
              <FieldLabel htmlFor="cert-percent">{t("percent")}</FieldLabel>
              <Input
                id="cert-percent"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="any"
                className="h-11 md:h-8"
                value={percent}
                onChange={(event) => setPercent(event.target.value)}
              />
            </Field>
          ) : null}
          {type.asks_subject ? (
            <Field>
              <FieldLabel htmlFor="cert-subject">{t("subject")}</FieldLabel>
              <Input
                id="cert-subject"
                className="h-11 md:h-8"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </Field>
          ) : null}
          {type.asks_year ? (
            <Field>
              <FieldLabel htmlFor="cert-year">{t("year")}</FieldLabel>
              <Input
                id="cert-year"
                type="number"
                inputMode="numeric"
                min={1990}
                max={2100}
                className="h-11 md:h-8"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </Field>
          ) : null}
          <CustomFieldInputs fields={type.custom_fields} values={custom} onChange={setCustom} />
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" className="min-h-11 md:min-h-8" disabled={!valid || save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
