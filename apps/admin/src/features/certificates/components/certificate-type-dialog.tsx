"use client"

import { useServerFieldErrors } from "@ihsp/features-core"
import {
  HONOR_CATEGORIES,
  keys,
  patchCertificateType,
  postCertificateType,
  type CertificateType,
  type CertificateTypeInput,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, ResponsiveDialog, Input } from "@ihsp/ui"
import { useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"
import { CustomFieldsEditor, draftValid, fromDraft, toDraft, type DraftField } from "./custom-fields-editor"

/** Create or edit a certificate type (`type` is null for a new one). A built-in type keeps its code. */
export function CertificateTypeDialog({ type, onClose }: { type: CertificateType | null; onClose: () => void }) {
  const t = useT("certificates.types")
  const [code, setCode] = useState(type?.code ?? "")
  const [names, setNames] = useState(type?.name ?? { uz: "", ru: "", en: "" })
  const [standard, setStandard] = useState(type?.standard ?? false)
  const [category, setCategory] = useState<string>(type?.category ?? "")
  const tc = useT("honorCategory")
  const [customFields, setCustomFields] = useState<DraftField[]>((type?.custom_fields ?? []).map(toDraft))
  const save = useAdminMutation({
    mutationFn: (body: CertificateTypeInput) =>
      type ? patchCertificateType(type.id, body) : postCertificateType(body),
    invalidate: [keys.certificates.all()],
    success: type ? t("updated") : t("created"),
    onSuccess: onClose,
  })
  const fieldErrors = useServerFieldErrors(save.error)
  const valid =
    code.trim() !== "" &&
    names.en.trim() !== "" &&
    names.ru.trim() !== "" &&
    names.uz.trim() !== "" &&
    customFields.every(draftValid)
  const submit = () =>
    save.mutate({
      code: code.trim(),
      name: { uz: names.uz.trim(), ru: names.ru.trim(), en: names.en.trim() },
      position: type?.position ?? 100,
      standard,
      category: HONOR_CATEGORIES.find((c) => c === category) ?? null,
      custom_fields: customFields.map(fromDraft),
    })
  return (
    <ResponsiveDialog
      formRef={fieldErrors.ref}
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="md"
      title={type ? t("edit", { name: type.name.en }) : t("add")}
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) submit()
      }}
      footer={
        <>
          <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" className={TOUCH} disabled={!valid || save.isPending}>
            {t("save")}
          </Button>
        </>
      }
    >
      <>
        <LabeledField label={t("code")} htmlFor="cert-code" required>
          <Input
            id="cert-code"
            className={TOUCH}
            value={code}
            disabled={type?.builtin}
            onChange={(e) => setCode(e.target.value)}
          />
        </LabeledField>
        {(["uz", "ru", "en"] as const).map((lang) => (
          <LabeledField
            key={lang}
            label={t(`name${lang === "uz" ? "Uz" : lang === "ru" ? "Ru" : "En"}`)}
            htmlFor={`cert-name-${lang}`}
            required
          >
            <Input
              id={`cert-name-${lang}`}
              className={TOUCH}
              value={names[lang]}
              onChange={(e) => setNames({ ...names, [lang]: e.target.value })}
            />
          </LabeledField>
        ))}
        <LabeledField label={t("category")} htmlFor="cert-category">
          <select
            id="cert-category"
            className={`border-input bg-background w-full rounded-md border px-2 text-sm ${TOUCH}`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{t("categoryNone")}</option>
            {HONOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {tc(c)}
              </option>
            ))}
          </select>
        </LabeledField>
        <label className="flex min-h-11 items-start gap-3 text-sm md:min-h-8">
          <input
            type="checkbox"
            role="switch"
            aria-label={t("standard")}
            className="mt-1 size-5 md:size-4"
            checked={standard}
            onChange={(e) => setStandard(e.target.checked)}
          />
          <span className="flex flex-col">
            <span className="font-medium">{t("standard")}</span>
            <span className="text-muted-foreground text-xs">{t("standardHint")}</span>
          </span>
        </label>
        <CustomFieldsEditor fields={customFields} onChange={setCustomFields} />
      </>
    </ResponsiveDialog>
  )
}
