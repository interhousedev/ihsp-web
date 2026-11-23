"use client"

import { certKeys, putCertSettings, type CertSettings, type CertTier, type OutlineSection } from "@ihsp/api"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  Checkbox,
  Icons,
  Input,
  Label,
  LoadingButton,
  Slider,
  SortableList,
  Switch,
} from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { toast } from "sonner"
import { pickLabel } from "../hooks/use-cert-fonts"
import { clamp, tierKey } from "../utils/layout"

const LOCALES = ["uz", "ru", "en"] as const
const SWATCHES = ["#B8860B", "#9CA3AF", "#B45309", "#2563EB", "#059669", "#7C3AED"]
const LABEL_MAX = 60

/** Rules: whether certificates are on, the passing mark, the optional sections and the tiers above the mark. */
export function RulesTab({
  courseId,
  settings,
  outline,
}: {
  courseId: string
  settings: CertSettings
  outline: OutlineSection[]
}) {
  const t = useT("courseCertificates")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<CertSettings>(settings)
  const ids = { enabled: useId(), passing: useId() }
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)
  const invalid = draft.tiers.some((tier) => LOCALES.some((l) => tier.label[l].trim() === ""))

  const save = useMutation({
    mutationFn: () => putCertSettings(courseId, draft),
    onSuccess: (next) => {
      queryClient.setQueryData(certKeys.settings(courseId), next)
      toast.success(t("rules.saved"))
    },
  })

  const setTier = (key: string, patch: Partial<CertTier>) =>
    setDraft((d) => ({ ...d, tiers: d.tiers.map((tier) => (tier.key === key ? { ...tier, ...patch } : tier)) }))
  const addTier = () =>
    setDraft((d) => ({
      ...d,
      tiers: [
        ...d.tiers,
        {
          key: tierKey(
            "tier",
            d.tiers.map((tier) => tier.key),
          ),
          label: { en: "", ru: "", uz: "" },
          min_pct: clamp(d.passing_pct + 10, d.passing_pct, 100),
          require_optional: false,
          color: SWATCHES[d.tiers.length % SWATCHES.length] ?? "#B8860B",
        },
      ],
    }))
  const toggleSection = (id: string, on: boolean) =>
    setDraft((d) => ({
      ...d,
      optional_section_ids: on ? [...d.optional_section_ids, id] : d.optional_section_ids.filter((s) => s !== id),
    }))

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <Card>
        <CardContent className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor={ids.enabled} className="text-base font-semibold">
              {t("rules.enabled")}
            </Label>
            <p className="text-muted-foreground text-sm">{t("rules.enabledHint")}</p>
          </div>
          <Switch
            id={ids.enabled}
            checked={draft.enabled}
            onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={ids.passing} className="text-base font-semibold">
              {t("rules.passing")}
            </Label>
            <span className="text-lg font-semibold tabular-nums">{draft.passing_pct}%</span>
          </div>
          <Slider
            id={ids.passing}
            min={1}
            max={100}
            step={1}
            value={[draft.passing_pct]}
            aria-label={t("rules.passing")}
            onValueChange={(value) => {
              const raw = Array.isArray(value) ? value[0] : value
              if (typeof raw === "number") setDraft({ ...draft, passing_pct: raw })
            }}
          />
          <p className="text-muted-foreground text-sm">{t("rules.passingHint")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">{t("rules.optional")}</h3>
          <p className="text-muted-foreground text-sm">{t("rules.optionalHint")}</p>
          {outline.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("rules.noSections")}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {outline.map((section) => {
                const checked = draft.optional_section_ids.includes(section.id)
                return (
                  <li key={section.id}>
                    <label className="hover:bg-muted flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 md:min-h-9">
                      <Checkbox checked={checked} onCheckedChange={(on) => toggleSection(section.id, on === true)} />
                      <span className="min-w-0 text-sm break-words">{section.title}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="cert-tiers" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="cert-tiers" className="text-base font-semibold">
            {t("rules.tiers")}
          </h3>
          <Button type="button" variant="outline" onClick={addTier} className="min-h-11 md:min-h-8">
            <Icons.add aria-hidden />
            {t("rules.addTier")}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">{t("rules.tiersHint")}</p>
        {draft.tiers.length === 0 ? (
          <p className="text-muted-foreground rounded-card border border-dashed p-4 text-sm">{t("rules.noTiers")}</p>
        ) : (
          <SortableList
            items={draft.tiers.map((tier) => ({ ...tier, id: tier.key }))}
            label={t("rules.tiers")}
            handleLabel={t("rules.reorder")}
            onReorder={(items) => setDraft({ ...draft, tiers: items.map(({ id: _id, ...tier }) => tier) })}
            renderItem={(tier) => (
              <TierRow
                tier={tier}
                passing={draft.passing_pct}
                title={pickLabel(tier.label, locale) || t("rules.untitled")}
                onChange={(patch) => setTier(tier.key, patch)}
                onRemove={() => setDraft({ ...draft, tiers: draft.tiers.filter((x) => x.key !== tier.key) })}
              />
            )}
          />
        )}
      </section>

      {save.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(save.error)}</AlertDescription>
        </Alert>
      ) : null}
      {invalid ? <p className="text-destructive text-sm">{t("rules.labelsRequired")}</p> : null}
      <div className="flex gap-2">
        <LoadingButton
          type="button"
          loading={save.isPending}
          disabled={!dirty || invalid}
          onClick={() => save.mutate()}
          className="min-h-11 md:min-h-9"
        >
          {t("save")}
        </LoadingButton>
        <Button
          type="button"
          variant="ghost"
          disabled={!dirty}
          onClick={() => setDraft(settings)}
          className="min-h-11 md:min-h-9"
        >
          {t("reset")}
        </Button>
      </div>
    </div>
  )
}

function TierRow({
  tier,
  passing,
  title,
  onChange,
  onRemove,
}: {
  tier: CertTier
  passing: number
  title: string
  onChange: (patch: Partial<CertTier>) => void
  onRemove: () => void
}) {
  const t = useT("courseCertificates")
  const base = useId()
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 py-2">
      <div className="flex items-center gap-2">
        <span aria-hidden className="size-4 shrink-0 rounded-full border" style={{ background: tier.color }} />
        <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={t("rules.removeTier", { name: title })}
          className="text-destructive min-h-11 md:min-h-8"
        >
          <Icons.trash aria-hidden />
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {LOCALES.map((l) => (
          <div key={l} className="flex flex-col gap-1">
            <Label htmlFor={`${base}-${l}`} className="text-xs">
              {t(`rules.label.${l}`)}
            </Label>
            <Input
              id={`${base}-${l}`}
              value={tier.label[l]}
              maxLength={LABEL_MAX}
              onChange={(e) => onChange({ label: { ...tier.label, [l]: e.target.value } })}
              className="min-h-11 md:min-h-9"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor={`${base}-min`} className="text-xs">
            {t("rules.minPct")}
          </Label>
          <Input
            id={`${base}-min`}
            type="number"
            inputMode="numeric"
            min={passing}
            max={100}
            placeholder={t("rules.minPctNone")}
            value={tier.min_pct ?? ""}
            onChange={(e) =>
              onChange({ min_pct: e.target.value === "" ? null : clamp(Math.round(Number(e.target.value)), 0, 100) })
            }
            className="min-h-11 w-28 md:min-h-9"
          />
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-9">
          <Switch checked={tier.require_optional} onCheckedChange={(on) => onChange({ require_optional: on })} />
          {t("rules.requireOptional")}
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">{t("rules.color")}</span>
          <div className="flex items-center gap-1">
            {SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                aria-pressed={tier.color.toLowerCase() === color.toLowerCase()}
                onClick={() => onChange({ color })}
                className="aria-pressed:ring-ring size-7 rounded-full border aria-pressed:ring-2"
                style={{ background: color }}
              />
            ))}
            <input
              type="color"
              aria-label={t("rules.customColor")}
              value={tier.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="size-8 cursor-pointer rounded border bg-transparent"
            />
          </div>
        </div>
      </div>
      {tier.min_pct !== null && tier.min_pct < passing ? (
        <p className="text-destructive text-xs">{t("rules.minBelowPassing", { passing })}</p>
      ) : null}
    </div>
  )
}
