"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, Input, Label } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { useSetMetrics, type Horizon, type Metric } from "../api"

type Row = { key: number; label: string; value: string; unit: string; horizon: Horizon; target_date: string }

const toRows = (metrics: Metric[]): Row[] =>
  metrics.map((m, key) => ({
    key,
    label: m.label,
    value: m.value,
    unit: m.unit ?? "",
    horizon: m.horizon === "projected" ? "projected" : "current",
    target_date: m.target_date ?? "",
  }))

/** Current and projected numbers of one item; projected rows are dashed and labelled "plans to". */
export function MetricsEditor({ itemId, metrics }: { itemId: string; metrics: Metric[] }) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const save = useSetMetrics(itemId)
  const [rows, setRows] = useState<Row[]>(() => toRows(metrics))
  const [next, setNext] = useState(rows.length)

  const update = (key: number, patch: Partial<Row>) =>
    setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const add = (horizon: Horizon) => {
    setRows((all) => [...all, { key: next, label: "", value: "", unit: "", horizon, target_date: "" }])
    setNext(next + 1)
  }
  const valid = rows.every((r) => r.label.trim() && r.value.trim() !== "" && Number.isFinite(Number(r.value)))
  const submit = () =>
    save.mutate(
      rows.map((r) => ({
        label: r.label.trim(),
        value: Number(r.value),
        unit: r.unit.trim(),
        horizon: r.horizon,
        target_date: r.horizon === "projected" && r.target_date ? r.target_date : null,
      })),
      { onSuccess: () => toast.success(t("saved")) },
    )

  return (
    <section aria-label={t("metrics.title")} className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t("metrics.title")}</h2>
      {rows.length === 0 ? <p className="text-muted-foreground text-sm">{t("metrics.empty")}</p> : null}
      <ul className="flex flex-col gap-3">
        {rows.map((row, index) => {
          const id = `metric-${row.key}`
          const projected = row.horizon === "projected"
          return (
            <li
              key={row.key}
              className={`flex flex-col gap-2 rounded-card border p-3 ${projected ? "border-dashed" : "border-hairline"}`}
            >
              <p className="text-muted-foreground text-xs font-medium">
                {projected ? t("metrics.plansTo") : t("metrics.current")}
              </p>
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`${id}-label`}>{t("metrics.label")}</Label>
                  <Input
                    id={`${id}-label`}
                    maxLength={80}
                    value={row.label}
                    onChange={(e) => update(row.key, { label: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`${id}-value`}>{t("metrics.value")}</Label>
                  <Input
                    id={`${id}-value`}
                    inputMode="decimal"
                    value={row.value}
                    onChange={(e) => update(row.key, { value: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`${id}-unit`}>{t("metrics.unit")}</Label>
                  <Input
                    id={`${id}-unit`}
                    maxLength={24}
                    value={row.unit}
                    onChange={(e) => update(row.key, { unit: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-end"
                  aria-label={t("metrics.remove", { n: index + 1 })}
                  onClick={() => setRows((all) => all.filter((r) => r.key !== row.key))}
                >
                  <Icons.trash aria-hidden />
                </Button>
              </div>
              {projected ? (
                <div className="flex flex-col gap-1 sm:max-w-48">
                  <Label htmlFor={`${id}-date`}>{t("metrics.targetDate")}</Label>
                  <Input
                    id={`${id}-date`}
                    type="date"
                    value={row.target_date}
                    onChange={(e) => update(row.key, { target_date: e.target.value })}
                  />
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => add("current")}>
          <Icons.add aria-hidden />
          {t("metrics.addCurrent")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => add("projected")}>
          <Icons.add aria-hidden />
          {t("metrics.addProjected")}
        </Button>
        <Button type="button" size="sm" disabled={!valid || save.isPending} onClick={submit}>
          {t("metrics.save")}
        </Button>
        {save.isSuccess ? (
          <span role="status" className="text-muted-foreground text-sm">
            {t("saved")}
          </span>
        ) : null}
        {save.isError ? (
          <span role="alert" className="text-destructive text-sm">
            {errorMessage(save.error)}
          </span>
        ) : null}
      </div>
    </section>
  )
}
