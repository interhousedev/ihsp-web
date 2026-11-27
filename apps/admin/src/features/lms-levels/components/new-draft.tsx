"use client"

import { useT } from "@ihsp/i18n"
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Icons, Input, Label, Slider } from "@ihsp/ui"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { createLevelScheme, levelKeys, putLevelTiers, type LevelScheme } from "../api"
import { LOCALES, xpToReach } from "../levels"

/** A new draft: its names and growth difficulty (the curve is fixed at creation); the ranks start as a copy of the live scheme. */
export function NewDraft({ active, onCreated, onCancel }: { active: LevelScheme | null; onCreated: (scheme: LevelScheme) => void; onCancel?: () => void }) {
  const t = useT("lmsLevels")
  const [names, setNames] = useState<Record<string, string>>({ ru: "", uz: "", en: "" })
  const [base, setBase] = useState(active?.curve.base ?? 50)
  const curve = { kind: "quadratic" as const, base }
  const create = useAdminMutation({
    mutationFn: async () => {
      const made = await createLevelScheme({ name: names, curve, scope: "platform" })
      return active && active.tiers.length > 0 ? putLevelTiers(made.id, active.tiers) : made
    },
    invalidate: [levelKeys.schemes()],
    onSuccess: onCreated,
  })
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t("newDraft.title")}</CardTitle>
        <CardDescription>{t("newDraft.description")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {LOCALES.map((l) => (
            <div key={l} className="grid gap-1.5">
              <Label htmlFor={`scheme-name-${l}`}>{t("curve.name")} · {l.toUpperCase()}</Label>
              <Input id={`scheme-name-${l}`} value={names[l] ?? ""} onChange={(event) => setNames((v) => ({ ...v, [l]: event.target.value }))} />
            </div>
          ))}
        </div>
        <div className="grid gap-2">
          <Label>{t("curve.base")}</Label>
          <Slider min={20} max={100} step={5} value={[base]} aria-label={t("curve.base")} onValueChange={(value) => setBase(Array.isArray(value) ? (value[0] ?? base) : value)} />
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>{t("curve.easier")}</span>
            <span>{t("curve.harder")}</span>
          </div>
          <p className="text-sm">{t("curve.example", { l5: xpToReach(5, curve), l10: xpToReach(10, curve) })}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" disabled={LOCALES.some((l) => (names[l] ?? "").trim() === "") || create.isPending} onClick={() => create.mutate()}>
            <Icons.add data-icon="inline-start" aria-hidden />
            {t("newDraft.create")}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("newDraft.cancel")}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
