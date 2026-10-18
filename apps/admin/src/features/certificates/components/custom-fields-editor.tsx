"use client"

import type { CustomField, CustomFieldKind } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Checkbox, Dropdown, Field, FieldLabel, Input } from "@ihsp/ui"
import { TOUCH } from "../../shared/utils/touch"

/** A field while it is edited: options are one text, one per line. */
export type DraftField = {
  key: string
  kind: CustomFieldKind
  label: { uz: string; ru: string; en: string }
  required: boolean
  optionsText: string
  allow_other: boolean
}

const KINDS: CustomFieldKind[] = ["text", "number", "single", "multi"]
const KIND_KEYS = { text: "kindText", number: "kindNumber", single: "kindSingle", multi: "kindMulti" } as const
const CHOICE = (kind: CustomFieldKind) => kind === "single" || kind === "multi"
const LANGS = ["uz", "ru", "en"] as const
const LANG_KEYS = { uz: "fieldLabelUz", ru: "fieldLabelRu", en: "fieldLabelEn" } as const

export function toDraft(field: CustomField): DraftField {
  return {
    key: field.key,
    kind: field.kind,
    label: { ...field.label },
    required: field.required,
    optionsText: field.options.join("\n"),
    allow_other: field.allow_other,
  }
}

export function fromDraft(draft: DraftField): CustomField {
  const choice = CHOICE(draft.kind)
  return {
    key: draft.key.trim(),
    kind: draft.kind,
    label: { uz: draft.label.uz.trim(), ru: draft.label.ru.trim(), en: draft.label.en.trim() },
    required: draft.required,
    options: choice
      ? draft.optionsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      : [],
    allow_other: choice && draft.allow_other,
  }
}

const KEY_RE = /^[a-z][a-z0-9_]{0,31}$/

/** Whether the draft can be saved: key, all three labels, and options for a choice kind. */
export function draftValid(draft: DraftField): boolean {
  if (!KEY_RE.test(draft.key.trim())) return false
  if (LANGS.some((lang) => draft.label[lang].trim() === "")) return false
  return !CHOICE(draft.kind) || fromDraft(draft).options.length > 0
}

/** Editor for the custom input fields of a certificate type. */
export function CustomFieldsEditor({
  fields,
  onChange,
}: {
  fields: DraftField[]
  onChange: (fields: DraftField[]) => void
}) {
  const t = useT("certificates.types")
  const update = (index: number, patch: Partial<DraftField>) =>
    onChange(fields.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  const remove = (index: number) => onChange(fields.filter((_, i) => i !== index))
  return (
    <section className="grid gap-3">
      <h3 className="text-sm font-medium">{t("customFields")}</h3>
      {fields.length === 0 ? <p className="text-muted-foreground text-sm">{t("fieldsEmpty")}</p> : null}
      {fields.map((field, index) => (
        <div key={index} className="grid gap-3 rounded-md border p-3">
          <Field>
            <FieldLabel htmlFor={`cf-key-${index}`}>{t("fieldKey")}</FieldLabel>
            <Input
              id={`cf-key-${index}`}
              className={TOUCH}
              value={field.key}
              onChange={(event) => update(index, { key: event.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`cf-kind-${index}`}>{t("fieldKind")}</FieldLabel>
            <Dropdown
              id={`cf-kind-${index}`}
              className="w-full"
              value={field.kind}
              onValueChange={(value) => update(index, { kind: value as CustomFieldKind })}
              options={KINDS.map((kind) => ({ value: kind, label: t(KIND_KEYS[kind]) }))}
            />
          </Field>
          {LANGS.map((lang) => (
            <Field key={lang}>
              <FieldLabel htmlFor={`cf-label-${index}-${lang}`}>{t(LANG_KEYS[lang])}</FieldLabel>
              <Input
                id={`cf-label-${index}-${lang}`}
                className={TOUCH}
                value={field.label[lang]}
                onChange={(event) => update(index, { label: { ...field.label, [lang]: event.target.value } })}
              />
            </Field>
          ))}
          {CHOICE(field.kind) ? (
            <>
              <Field>
                <FieldLabel htmlFor={`cf-options-${index}`}>{t("fieldOptions")}</FieldLabel>
                <textarea
                  id={`cf-options-${index}`}
                  className="border-input min-h-24 rounded-md border bg-transparent p-2 text-sm"
                  value={field.optionsText}
                  onChange={(event) => update(index, { optionsText: event.target.value })}
                />
                <p className="text-muted-foreground text-xs">{t("fieldOptionsHint")}</p>
              </Field>
              <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                <Checkbox
                  checked={field.allow_other}
                  onCheckedChange={(checked) => update(index, { allow_other: checked === true })}
                />
                {t("fieldAllowOther")}
              </label>
            </>
          ) : null}
          <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
            <Checkbox
              checked={field.required}
              onCheckedChange={(checked) => update(index, { required: checked === true })}
            />
            {t("fieldRequired")}
          </label>
          <div>
            <Button type="button" variant="outline" className={TOUCH} onClick={() => remove(index)}>
              {t("removeField")}
            </Button>
          </div>
        </div>
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          className={TOUCH}
          onClick={() =>
            onChange([
              ...fields,
              {
                key: "",
                kind: "text",
                label: { uz: "", ru: "", en: "" },
                required: false,
                optionsText: "",
                allow_other: false,
              },
            ])
          }
        >
          {t("addField")}
        </Button>
      </div>
    </section>
  )
}
