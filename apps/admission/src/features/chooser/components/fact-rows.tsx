"use client"

import { useT } from "@ihsp/i18n"
import { StateView } from "@ihsp/ui"
import type { Fact } from "../types"
import { FactSource } from "./fact-source"
import { useOptionLabel } from "./option-label"

type Loose = { (key: string, values?: Record<string, string | number>): string; has: (key: string) => boolean }

function useFormat() {
  const t = useT("chooser") as unknown as Loose
  const fieldLabel = useOptionLabel("fact")
  return (value: unknown): string => {
    if (typeof value === "boolean") return value ? t("yes") : t("no")
    if (typeof value === "number") return new Intl.NumberFormat().format(value)
    if (typeof value === "string") return fieldLabel(value)
    if (Array.isArray(value))
      return value.map((item) => (typeof item === "string" ? fieldLabel(item) : String(item))).join(", ")
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>
      if ("min" in record || "max" in record) return `${record.min ?? "?"}–${record.max ?? "?"}`
      return Object.entries(record)
        .map(([key, item]) => `${key}: ${String(item)}`)
        .join(", ")
    }
    return ""
  }
}

/** The recorded facts of one tab, each with its source; nothing recorded is said plainly. */
export function FactRows({ facts }: { facts: [string, Fact][] }) {
  const t = useT("chooser") as unknown as Loose
  const format = useFormat()
  const rows = facts.filter(([, fact]) => fact.value !== null && fact.value !== undefined && fact.value !== "")
  if (rows.length === 0) return <StateView state="empty" title={t("tabEmpty.title")} description={t("tabEmpty.text")} />
  return (
    <dl className="flex flex-col divide-y">
      {rows.map(([key, fact]) => (
        <div key={key} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
          <dt className="text-muted-foreground w-52 shrink-0 text-sm">
            {t.has(`facts.${key}`) ? t(`facts.${key}`) : key}
          </dt>
          <dd className="flex min-w-0 flex-col gap-1">
            <span className="text-sm font-medium">{format(fact.value)}</span>
            <FactSource fact={fact} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
