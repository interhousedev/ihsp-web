"use client"

import {
  keys,
  patchCertificateType,
  postCertificateType,
  type CertificateType,
  type CertificateTypeInput,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "@ihsp/ui"
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
  const [customFields, setCustomFields] = useState<DraftField[]>((type?.custom_fields ?? []).map(toDraft))
  const save = useAdminMutation({
    mutationFn: (body: CertificateTypeInput) =>
      type ? patchCertificateType(type.id, body) : postCertificateType(body),
    invalidate: [keys.certificates.all()],
    success: type ? t("updated") : t("created"),
    onSuccess: onClose,
  })
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
      custom_fields: customFields.map(fromDraft),
    })
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-lg">
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            if (valid) submit()
          }}
        >
          <DialogHeader className="border-b p-4 pr-12">
            <DialogTitle>{type ? t("edit", { name: type.name.en }) : t("add")}</DialogTitle>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4">
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
            <CustomFieldsEditor fields={customFields} onChange={setCustomFields} />
          </div>
          <DialogFooter className="border-t p-4">
            <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
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
