"use client"

import {
  keys,
  patchCertificateType,
  postCertificateType,
  type CertificateType,
  type CertificateTypeInput,
} from "@ihsp/api"
import { parseLevels } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, Checkbox, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "@ihsp/ui"
import { useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

const FLAGS = ["asks_level", "asks_score", "asks_percent", "asks_subject", "asks_year"] as const
const FLAG_KEYS = {
  asks_level: "asksLevel",
  asks_score: "asksScore",
  asks_percent: "asksPercent",
  asks_subject: "asksSubject",
  asks_year: "asksYear",
} as const

function numberOrNull(text: string): number | null {
  const value = Number(text)
  return text.trim() === "" || Number.isNaN(value) ? null : value
}

/** Create or edit a certificate type (`type` is null for a new one). A built-in type keeps its code. */
export function CertificateTypeDialog({ type, onClose }: { type: CertificateType | null; onClose: () => void }) {
  const t = useT("certificates.types")
  const [code, setCode] = useState(type?.code ?? "")
  const [names, setNames] = useState(type?.name ?? { uz: "", ru: "", en: "" })
  const [levels, setLevels] = useState((type?.levels ?? []).join(", "))
  const [min, setMin] = useState(type?.score_min != null ? String(type.score_min) : "")
  const [max, setMax] = useState(type?.score_max != null ? String(type.score_max) : "")
  const [flags, setFlags] = useState({
    asks_level: type?.asks_level ?? false,
    asks_score: type?.asks_score ?? false,
    asks_percent: type?.asks_percent ?? false,
    asks_subject: type?.asks_subject ?? false,
    asks_year: type?.asks_year ?? true,
  })
  const save = useAdminMutation({
    mutationFn: (body: CertificateTypeInput) =>
      type ? patchCertificateType(type.id, body) : postCertificateType(body),
    invalidate: [keys.certificates.all()],
    success: type ? t("updated") : t("created"),
    onSuccess: onClose,
  })
  const valid = code.trim() !== "" && names.en.trim() !== "" && names.ru.trim() !== "" && names.uz.trim() !== ""
  const submit = () =>
    save.mutate({
      code: code.trim(),
      name: { uz: names.uz.trim(), ru: names.ru.trim(), en: names.en.trim() },
      levels: parseLevels(levels),
      ...flags,
      score_min: flags.asks_score ? numberOrNull(min) : null,
      score_max: flags.asks_score ? numberOrNull(max) : null,
      position: type?.position ?? 100,
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
            <DialogTitle>{type ? t("edit", { name: type.name.en }) : t("add")}</DialogTitle>
          </DialogHeader>
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
          <LabeledField label={t("levels")} htmlFor="cert-levels" description={t("levelsHint")}>
            <Input id="cert-levels" className={TOUCH} value={levels} onChange={(e) => setLevels(e.target.value)} />
          </LabeledField>
          {flags.asks_score ? (
            <div className="grid grid-cols-2 gap-3">
              <LabeledField label={t("scoreMin")} htmlFor="cert-min">
                <Input
                  id="cert-min"
                  inputMode="decimal"
                  className={TOUCH}
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </LabeledField>
              <LabeledField label={t("scoreMax")} htmlFor="cert-max">
                <Input
                  id="cert-max"
                  inputMode="decimal"
                  className={TOUCH}
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                />
              </LabeledField>
            </div>
          ) : null}
          <div className="grid gap-2">
            {FLAGS.map((flag) => (
              <label key={flag} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
                <Checkbox
                  checked={flags[flag]}
                  onCheckedChange={(checked) => setFlags({ ...flags, [flag]: checked === true })}
                />
                {t(FLAG_KEYS[flag])}
              </label>
            ))}
          </div>
          <DialogFooter>
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
