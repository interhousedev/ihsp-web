"use client"

import type { CustomField, CustomFieldKind } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  Checkbox,
  Dropdown,
  Field,
  FieldLabel,
  IconChevronDown,
  IconChevronUp,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
  Input,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
} from "@ihsp/ui"
import { useState } from "react"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"

/** A field while it is edited: options are a list of chips. */
export type DraftField = {
  key: string
  kind: CustomFieldKind
  label: { uz: string; ru: string; en: string }
  required: boolean
  options: string[]
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
    options: [...field.options],
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
    options: choice ? draft.options : [],
    allow_other: choice && draft.allow_other,
  }
}

const KEY_RE = /^[a-z][a-z0-9_]{0,31}$/

/** Whether the draft can be saved: key, all three labels, and options for a choice kind. */
export function draftValid(draft: DraftField): boolean {
  if (!KEY_RE.test(draft.key.trim())) return false
  if (LANGS.some((lang) => draft.label[lang].trim() === "")) return false
  return !CHOICE(draft.kind) || draft.options.length > 0
}

function newDraft(): DraftField {
  return { key: "", kind: "text", label: { uz: "", ru: "", en: "" }, required: false, options: [], allow_other: false }
}

/** Compact list of a type's custom fields; one field is edited in a side panel. */
export function CustomFieldsEditor({
  fields,
  onChange,
}: {
  fields: DraftField[]
  onChange: (fields: DraftField[]) => void
}) {
  const t = useT("certificates.types")
  const locale = useLocale()
  const [panel, setPanel] = useState<{ index: number | null; draft: DraftField } | null>(null)
  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= fields.length) return
    const next = [...fields]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  const remove = (index: number) => onChange(fields.filter((_, i) => i !== index))
  const save = (draft: DraftField) => {
    if (!panel) return
    onChange(panel.index === null ? [...fields, draft] : fields.map((item, i) => (i === panel.index ? draft : item)))
    setPanel(null)
  }
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{t("customFields")}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={TOUCH}
          onClick={() => setPanel({ index: null, draft: newDraft() })}
        >
          <IconPlus aria-hidden /> {t("addField")}
        </Button>
      </div>
      {fields.length === 0 ? <p className="text-muted-foreground text-sm">{t("fieldsEmpty")}</p> : null}
      {fields.length > 0 ? (
        <ul className="grid gap-2">
          {fields.map((field, index) => {
            const labels = field.label as Record<string, string | undefined>
            const name = labels[locale] || field.label.en || field.key
            return (
              <li key={index} className="flex items-center gap-2 rounded-md border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="text-muted-foreground truncate text-xs">{field.key}</p>
                </div>
                <Badge variant="secondary">{t(KIND_KEYS[field.kind])}</Badge>
                {field.required ? <Badge variant="outline">{t("requiredBadge")}</Badge> : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={TOUCH_ICON}
                  aria-label={t("moveUp", { name })}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <IconChevronUp aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={TOUCH_ICON}
                  aria-label={t("moveDown", { name })}
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <IconChevronDown aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={TOUCH_ICON}
                  aria-label={t("editField", { name })}
                  onClick={() => setPanel({ index, draft: toDraft(field) })}
                >
                  <IconPencil aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={TOUCH_ICON}
                  aria-label={t("deleteField", { name })}
                  onClick={() => remove(index)}
                >
                  <IconTrash aria-hidden />
                </Button>
              </li>
            )
          })}
        </ul>
      ) : null}
      <Sheet open={panel !== null} onOpenChange={(open) => (open ? undefined : setPanel(null))}>
        {panel ? (
          <FieldPanel
            key={panel.index ?? "new"}
            title={panel.index === null ? t("fieldPanelAdd") : t("editField", { name: panel.draft.key })}
            initial={panel.draft}
            onSave={save}
            onClose={() => setPanel(null)}
          />
        ) : null}
      </Sheet>
    </section>
  )
}

/** Side panel that edits one field; its draft stays local until Done. */
function FieldPanel({
  title,
  initial,
  onSave,
  onClose,
}: {
  title: string
  initial: DraftField
  onSave: (draft: DraftField) => void
  onClose: () => void
}) {
  const t = useT("certificates.types")
  const [draft, setDraft] = useState(initial)
  const [option, setOption] = useState("")
  const patch = (next: Partial<DraftField>) => setDraft((current) => ({ ...current, ...next }))
  const addOption = () => {
    const text = option.trim()
    if (text !== "" && !draft.options.includes(text)) patch({ options: [...draft.options, text] })
    setOption("")
  }
  return (
    <SheetContent side="right" className="flex h-full flex-col gap-0 p-0 sm:max-w-md">
      <SheetHeader className="border-b p-4">
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4">
        <Field>
          <FieldLabel htmlFor="cf-key">{t("fieldKey")}</FieldLabel>
          <Input
            id="cf-key"
            className={TOUCH}
            value={draft.key}
            onChange={(event) => patch({ key: event.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="cf-kind">{t("fieldKind")}</FieldLabel>
          <Dropdown
            id="cf-kind"
            className="w-full"
            value={draft.kind}
            onValueChange={(value) => patch({ kind: value as CustomFieldKind })}
            options={KINDS.map((kind) => ({ value: kind, label: t(KIND_KEYS[kind]) }))}
          />
        </Field>
        {LANGS.map((lang) => (
          <Field key={lang}>
            <FieldLabel htmlFor={`cf-label-${lang}`}>{t(LANG_KEYS[lang])}</FieldLabel>
            <Input
              id={`cf-label-${lang}`}
              className={TOUCH}
              value={draft.label[lang]}
              onChange={(event) => patch({ label: { ...draft.label, [lang]: event.target.value } })}
            />
          </Field>
        ))}
        {CHOICE(draft.kind) ? (
          <>
            <Field>
              <FieldLabel htmlFor="cf-option">{t("fieldOptions")}</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {draft.options.map((item, index) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-3 text-sm"
                  >
                    {item}
                    <button
                      type="button"
                      aria-label={t("removeOption", { option: item })}
                      className="hover:bg-muted rounded-full p-1"
                      onClick={() => patch({ options: draft.options.filter((_, i) => i !== index) })}
                    >
                      <IconX className="size-3.5" aria-hidden />
                    </button>
                  </span>
                ))}
                {draft.options.length === 0 ? (
                  <p className="text-muted-foreground text-xs">{t("fieldOptionsEmpty")}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Input
                  id="cf-option"
                  className={TOUCH}
                  value={option}
                  placeholder={t("optionPlaceholder")}
                  onChange={(event) => setOption(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      addOption()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className={TOUCH}
                  disabled={option.trim() === ""}
                  onClick={addOption}
                >
                  {t("addOption")}
                </Button>
              </div>
            </Field>
            <label className="flex min-h-11 items-center justify-between gap-2 text-sm md:min-h-8">
              {t("fieldAllowOther")}
              <Switch checked={draft.allow_other} onCheckedChange={(checked) => patch({ allow_other: checked })} />
            </label>
          </>
        ) : null}
        <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
          <Checkbox checked={draft.required} onCheckedChange={(checked) => patch({ required: checked === true })} />
          {t("fieldRequired")}
        </label>
      </div>
      <SheetFooter className="border-t p-4">
        <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button type="button" className={TOUCH} disabled={!draftValid(draft)} onClick={() => onSave(draft)}>
          {t("fieldDone")}
        </Button>
      </SheetFooter>
    </SheetContent>
  )
}
