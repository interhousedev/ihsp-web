"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Skeleton, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { FACT_KEYS, type CountryFact, type FactKey } from "../../countries/api"
import { useCountryName } from "../../countries/components/country-facts-view"
import { usePutCountry, useStoredCountry } from "../api"

const LOCALES = ["en", "ru", "uz"] as const
type Draft = { score: string; values: string; text: Record<(typeof LOCALES)[number], string>; sources: string }

const emptyDraft = (): Draft => ({ score: "", values: "", text: { en: "", ru: "", uz: "" }, sources: "" })
const toDraft = (f?: CountryFact): Draft =>
  f
    ? {
        score: f.score === null ? "" : String(f.score),
        values: Object.keys(f.values).length ? JSON.stringify(f.values) : "",
        text: { en: f.text.en ?? "", ru: f.text.ru ?? "", uz: f.text.uz ?? "" },
        sources: f.sources.join("\n"),
      }
    : emptyDraft()

function Form({
  code,
  initial,
  asOf,
  onDone,
}: {
  code: string
  initial: Record<string, Draft>
  asOf: string
  onDone: () => void
}) {
  const t = useT("countries")
  const errorMessage = useErrorMessage()
  const put = usePutCountry(code)
  const [drafts, setDrafts] = useState(initial)
  const [date, setDate] = useState(asOf)
  const [invalid, setInvalid] = useState<string | null>(null)
  const patch = (k: string, next: Partial<Draft>) => setDrafts((d) => ({ ...d, [k]: { ...d[k]!, ...next } }))

  function save(verified: boolean) {
    const facts: Partial<Record<FactKey, CountryFact>> = {}
    for (const k of FACT_KEYS) {
      const d = drafts[k]!
      let values: CountryFact["values"] = {}
      try {
        values = d.values.trim() ? JSON.parse(d.values) : {}
      } catch {
        setInvalid(k)
        return
      }
      const sources = d.sources
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
      if (d.score === "" && !Object.keys(values).length && !LOCALES.some((l) => d.text[l].trim())) continue
      facts[k] = { score: d.score === "" ? null : Number(d.score), values, text: d.text, sources }
    }
    setInvalid(null)
    put.mutate(
      { as_of: date, verified, facts },
      {
        onSuccess: () => {
          toast.success(t("staff.saved"))
          onDone()
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {t("staff.asOf")}
        <Input value={date} placeholder="2026-11" onChange={(e) => setDate(e.target.value)} />
      </label>
      {FACT_KEYS.map((k) => (
        <fieldset key={k} className="flex flex-col gap-2 rounded-card border p-3">
          <legend className="px-1 text-sm font-semibold">{t(`fact.${k}`)}</legend>
          <Input
            type="number"
            min={1}
            max={5}
            aria-label={`${t(`fact.${k}`)} ${t("overall")}`}
            placeholder={t("overall")}
            value={drafts[k]!.score}
            onChange={(e) => patch(k, { score: e.target.value })}
          />
          <Textarea
            rows={2}
            aria-label={`${t(`fact.${k}`)} ${t("staff.values")}`}
            placeholder={t("staff.values")}
            value={drafts[k]!.values}
            onChange={(e) => patch(k, { values: e.target.value })}
          />
          {invalid === k ? (
            <p role="alert" className="text-destructive text-xs">
              {t("staff.badValues")}
            </p>
          ) : null}
          {LOCALES.map((l) => (
            <Textarea
              key={l}
              rows={2}
              aria-label={`${t(`fact.${k}`)} ${l}`}
              placeholder={l.toUpperCase()}
              value={drafts[k]!.text[l]}
              onChange={(e) => patch(k, { text: { ...drafts[k]!.text, [l]: e.target.value } })}
            />
          ))}
          <Textarea
            rows={2}
            aria-label={`${t(`fact.${k}`)} ${t("staff.sources")}`}
            placeholder={t("staff.sources")}
            value={drafts[k]!.sources}
            onChange={(e) => patch(k, { sources: e.target.value })}
          />
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={put.isPending}
          onClick={() => save(false)}
        >
          {t("staff.saveDraft")}
        </Button>
        <Button type="button" className="min-h-11" disabled={put.isPending} onClick={() => save(true)}>
          {t("staff.saveVerified")}
        </Button>
      </div>
    </div>
  )
}

export function CountryEditDialog({ code, onClose }: { code: string; onClose: () => void }) {
  const name = useCountryName()
  const stored = useStoredCountry(code)
  const initial = Object.fromEntries(FACT_KEYS.map((k) => [k, toDraft(stored.data?.facts[k])]))
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{name(code)}</DialogTitle>
        </DialogHeader>
        {stored.isPending ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <Form code={code} initial={initial} asOf={stored.data?.as_of ?? ""} onDone={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
