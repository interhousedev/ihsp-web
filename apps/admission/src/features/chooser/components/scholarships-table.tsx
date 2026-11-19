"use client"

import { useT } from "@ihsp/i18n"
import { Icons, Pill, StateView } from "@ihsp/ui"
import type { Scholarship } from "../types"
import { useOptionLabel } from "./option-label"

export function coverage(item: Pick<Scholarship, "coverage_min" | "coverage_max">): string | null {
  const { coverage_min: min, coverage_max: max } = item
  if (min === null && max === null) return null
  if (min !== null && max !== null && min !== max) return `${min}–${max}%`
  return `${min ?? max}%`
}

export function ScholarshipList({ items }: { items: Scholarship[] }) {
  const t = useT("chooser")
  const basisLabel = useOptionLabel("scholarshipBasis")
  const countryLabel = useOptionLabel("country")
  const coverLabel = useOptionLabel("fact")
  if (items.length === 0)
    return (
      <StateView
        state="empty"
        icon={<Icons.info className="size-8" aria-hidden />}
        title={t("scholarships.emptyTitle")}
        description={t("scholarships.emptyText")}
      />
    )
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">{t("scholarships.title")}</h3>
      <ul className="flex flex-col gap-3" aria-label={t("scholarships.title")}>
        {items.map((item) => (
          <li
            key={item.id}
            className="bg-card border-hairline-strong rounded-card flex min-w-0 flex-col gap-2 overflow-hidden border p-4 [overflow-wrap:anywhere]"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold">{item.name}</h4>
                {item.provider ? <p className="text-muted-foreground text-xs">{item.provider}</p> : null}
              </div>
              {coverage(item) ? (
                <Pill tone="success">{t("scholarships.coverage", { value: coverage(item) as string })}</Pill>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {item.basis ? <Pill tone="primary">{basisLabel(item.basis)}</Pill> : null}
              {item.country ? <Pill>{countryLabel(item.country)}</Pill> : null}
              {item.cycle ? <Pill>{item.cycle}</Pill> : null}
              {item.covers.map((cover) => (
                <Pill key={cover}>{coverLabel(cover)}</Pill>
              ))}
            </div>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex min-h-11 w-fit items-center gap-1 text-xs underline-offset-2 hover:underline"
              >
                {t("source")}
                <Icons.externalLink className="size-3" aria-hidden />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
