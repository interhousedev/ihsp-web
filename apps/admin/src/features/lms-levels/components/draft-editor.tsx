"use client"

import { QueryState } from "@ihsp/features-core"
import { useLocale, useT } from "@ihsp/i18n"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Icons,
  Input,
  Label,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import {
  activateLevelScheme,
  getLevelPreviewQuery,
  levelKeys,
  putLevelTiers,
  type LevelPreview,
  type LevelScheme,
  type LevelTier,
} from "../api"
import { checks, countAt, LOCALES, MAX_LEVEL, pick, sameTiers, xpToReach } from "../levels"

const PALETTE = [
  { key: "slate", hex: "#64748b" },
  { key: "sky", hex: "#0ea5e9" },
  { key: "emerald", hex: "#10b981" },
  { key: "amber", hex: "#f59e0b" },
  { key: "violet", hex: "#8b5cf6" },
  { key: "rose", hex: "#f43f5e" },
] as const
const SELECT_CLASS =
  "border-input bg-background h-9 min-h-11 w-full rounded-lg border px-2 text-sm md:min-h-9 focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"

type Row = LevelTier & { key: string }

type Props = {
  scheme: LevelScheme
  active: LevelScheme | null
  rewardBadges: { id: string; name: Record<string, string> }[]
  onActivated: (previous: LevelScheme | null, now: LevelScheme) => void
}

/** One draft: its ranks, the server preview on today's learners and the guarded activation. */
export function DraftEditor({ scheme, active, rewardBadges, onActivated }: Props) {
  const t = useT("lmsLevels")
  const locale = useLocale()
  const [rows, setRows] = useState<Row[]>(() => scheme.tiers.map((tier, i) => ({ ...tier, key: `t${i}` })))
  const [confirming, setConfirming] = useState(false)
  const preview = useQuery(getLevelPreviewQuery(scheme.id))

  const tiers: LevelTier[] = rows.map(({ key: _key, ...tier }) => tier)
  const dirty = !sameTiers(tiers, scheme.tiers)
  const verdicts = checks(tiers)
  const broken = verdicts.filter((v) => !v.ok)

  const patch = (key: string, change: Partial<LevelTier>) =>
    setRows((list) => list.map((row) => (row.key === key ? { ...row, ...change } : row)))
  const addTier = () =>
    setRows((list) => [
      ...list,
      {
        key: `n${Date.now()}`,
        level_from: Math.min(MAX_LEVEL, (list[list.length - 1]?.level_from ?? 1) + 3),
        title: { ru: "", uz: "", en: "" },
        color: "#f59e0b",
        icon: "star",
        reward_badge_id: null,
      },
    ])

  const save = useAdminMutation({
    mutationFn: () => putLevelTiers(scheme.id, tiers),
    invalidate: [levelKeys.schemes()],
    success: t("saved"),
  })
  const activate = useAdminMutation({
    mutationFn: async () => {
      if (dirty) await putLevelTiers(scheme.id, tiers)
      return activateLevelScheme(scheme.id)
    },
    invalidate: [levelKeys.schemes()],
    onSuccess: (now) => {
      setConfirming(false)
      onActivated(active, now)
    },
  })

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <Card className="min-w-0 xl:col-start-1">
          <CardHeader>
            <CardTitle>{pick(scheme.name, locale)}</CardTitle>
            <CardDescription>{t("curve.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm">
              {t("curve.example", { l5: xpToReach(5, scheme.curve), l10: xpToReach(10, scheme.curve) })}
            </p>
            <ol className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8" aria-label={t("curve.table")}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((level) => (
                <li key={level} className="bg-muted/50 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-muted-foreground text-xs">{t("curve.level", { level })}</p>
                  <p className="text-sm font-semibold tabular-nums">{xpToReach(level, scheme.curve)}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card
          className="min-w-0 xl:sticky xl:top-4 xl:col-start-2 xl:row-span-2 xl:row-start-1"
          data-testid="level-preview"
        >
          <CardHeader>
            <CardTitle>{t("preview.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState query={preview} rows={4}>
              {(data) => <PreviewChart data={data} />}
            </QueryState>
          </CardContent>
        </Card>

        <Card className="min-w-0 xl:col-start-1">
          <CardHeader>
            <CardTitle>{t("tiers.title")}</CardTitle>
            <CardDescription>{t("tiers.description")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {rows.map((tier, index) => {
              const next = rows[index + 1]
              const wrongOrder = index > 0 && tier.level_from <= (rows[index - 1]?.level_from ?? 0)
              return (
                <div key={tier.key} className="grid gap-3 rounded-card border p-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2 sm:col-span-3">
                    <span className="size-4 rounded-full" style={{ backgroundColor: tier.color }} aria-hidden />
                    <span className="text-sm font-semibold tabular-nums">
                      {next
                        ? t("tiers.range", { from: tier.level_from, to: next.level_from - 1 })
                        : t("tiers.open", { from: tier.level_from })}
                    </span>
                    {rows.length > 1 && index > 0 ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto size-11 md:size-9"
                        type="button"
                        aria-label={t("tiers.remove")}
                        onClick={() => setRows((list) => list.filter((x) => x.key !== tier.key))}
                      >
                        <Icons.trash aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                  {LOCALES.map((l) => (
                    <div key={l} className="grid gap-1.5">
                      <Label htmlFor={`title-${tier.key}-${l}`}>
                        {t("tiers.titleLabel")} · {l.toUpperCase()}
                      </Label>
                      <Input
                        id={`title-${tier.key}-${l}`}
                        value={tier.title[l] ?? ""}
                        aria-invalid={(tier.title[l] ?? "").trim() === ""}
                        onChange={(event) => patch(tier.key, { title: { ...tier.title, [l]: event.target.value } })}
                      />
                    </div>
                  ))}
                  <div className="grid gap-1.5">
                    <Label htmlFor={`from-${tier.key}`}>{t("tiers.from")}</Label>
                    <Input
                      id={`from-${tier.key}`}
                      type="number"
                      min={1}
                      max={MAX_LEVEL}
                      value={tier.level_from}
                      disabled={index === 0}
                      aria-invalid={wrongOrder}
                      onChange={(event) => patch(tier.key, { level_from: Number(event.target.value) })}
                    />
                    {wrongOrder ? <p className="text-destructive text-xs">{t("checks.increasing")}</p> : null}
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor={`reward-${tier.key}`}>{t("tiers.reward")}</Label>
                    <select
                      id={`reward-${tier.key}`}
                      className={SELECT_CLASS}
                      value={tier.reward_badge_id ?? ""}
                      onChange={(event) => patch(tier.key, { reward_badge_id: event.target.value || null })}
                    >
                      <option value="">{t("tiers.noReward")}</option>
                      {rewardBadges.map((badge) => (
                        <option key={badge.id} value={badge.id}>
                          {pick(badge.name, locale)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    className="flex flex-wrap items-center gap-1 sm:col-span-3"
                    role="radiogroup"
                    aria-label={t("tiers.color")}
                  >
                    {PALETTE.map((color) => (
                      <button
                        key={color.key}
                        type="button"
                        role="radio"
                        aria-checked={tier.color === color.hex}
                        aria-label={t(`colors.${color.key}`)}
                        onClick={() => patch(tier.key, { color: color.hex })}
                        className="flex size-11 items-center justify-center rounded-full focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
                      >
                        <span
                          className={`size-8 rounded-full ${tier.color === color.hex ? "ring-foreground ring-2 ring-offset-2" : ""}`}
                          style={{ backgroundColor: color.hex }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            <div>
              <Button variant="outline" type="button" onClick={addTier}>
                <Icons.add data-icon="inline-start" aria-hidden />
                {t("tiers.add")}
              </Button>
            </div>
            {broken.length > 0 ? (
              <ul className="grid gap-1.5" aria-label={t("checks.title")}>
                {broken.map((v) => (
                  <li key={v.id} className="text-destructive flex items-center gap-2 text-sm">
                    <Icons.warning className="size-4" aria-hidden />
                    {t(`checks.${v.id}`)}
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="bg-background/95 sticky bottom-0 z-20 -mx-4 flex items-center gap-2 border-t p-3 backdrop-blur md:-mx-6 md:px-6">
        <p className="text-muted-foreground hidden flex-1 text-sm sm:block">{dirty ? t("unsaved") : t("noChanges")}</p>
        <div className="flex flex-1 gap-2 sm:flex-none">
          <Button
            variant="outline"
            type="button"
            className="flex-1 sm:flex-none"
            disabled={!dirty || broken.length > 0 || save.isPending}
            onClick={() => save.mutate()}
          >
            {t("saveDraft")}
          </Button>
          <Button
            type="button"
            className="flex-1 sm:flex-none"
            disabled={broken.length > 0}
            onClick={() => setConfirming(true)}
          >
            <Icons.check data-icon="inline-start" aria-hidden />
            {t("activate")}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("confirm.title", { name: pick(scheme.name, locale) })}
        description={active ? t("confirm.body", { previous: pick(active.name, locale) }) : t("confirm.bodyFirst")}
        confirmLabel={t("confirm.ok")}
        onConfirm={() => activate.mutate()}
      />
    </>
  )
}

function PreviewChart({ data }: { data: LevelPreview }) {
  const t = useT("lmsLevels")
  const levels = Array.from({ length: MAX_LEVEL }, (_, i) => ({
    level: i + 1,
    before: countAt(data.before, i + 1),
    after: countAt(data.after, i + 1),
  }))
  const total = levels.reduce((sum, row) => sum + row.before, 0)
  const moved = levels.reduce((sum, row) => sum + Math.max(0, row.after - row.before), 0)
  const peak = Math.max(1, ...levels.flatMap((l) => [l.before, l.after]))
  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground text-sm">{t("preview.description", { total })}</p>
      {moved === 0 ? (
        <p className="bg-muted/50 rounded-lg p-3 text-sm font-medium">{t("preview.none")}</p>
      ) : (
        <div className="bg-success-muted rounded-lg p-3">
          <p className="text-success text-2xl font-semibold tabular-nums">{moved}</p>
          <p className="text-sm">{t("preview.changed")}</p>
        </div>
      )}
      <p className="text-muted-foreground flex items-start gap-2 text-xs">
        <Icons.info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t("preview.note")}
      </p>
      <div>
        <div className="text-muted-foreground mb-2 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="bg-muted-foreground/40 size-2.5 rounded-sm" />
            {t("preview.before")}
          </span>
          <span className="flex items-center gap-1">
            <span className="bg-primary size-2.5 rounded-sm" />
            {t("preview.after")}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground w-4 rotate-180 text-[10px] [writing-mode:vertical-rl]">
            {t("preview.axisY")}
          </span>
          <ol className="flex h-36 flex-1 items-end gap-1" aria-label={t("preview.chart")}>
            {levels.map((row) => (
              <li key={row.level} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
                <div className="flex flex-1 items-end gap-px">
                  <span
                    className="bg-muted-foreground/40 w-1/2 rounded-t-sm"
                    style={{ height: `${(row.before / peak) * 100}%` }}
                    title={`${row.before}`}
                  />
                  <span
                    className="bg-primary w-1/2 rounded-t-sm"
                    style={{ height: `${(row.after / peak) * 100}%` }}
                    title={`${row.after}`}
                  />
                </div>
                <span className="text-muted-foreground text-center text-[10px] tabular-nums">{row.level}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-muted-foreground mt-1 text-center text-[10px]">{t("preview.axisX")}</p>
      </div>
    </div>
  )
}
