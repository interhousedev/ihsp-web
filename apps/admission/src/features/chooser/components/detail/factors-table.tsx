"use client"

import type { AdmissionImportanceFactor } from "@ihsp/api"
import { useT } from "@ihsp/i18n"

export const IMPORTANCE_LEVELS = ["very_important", "important", "considered", "not_considered"] as const
type Importance = (typeof IMPORTANCE_LEVELS)[number]

const FILLED: Record<Importance, number> = { very_important: 3, important: 2, considered: 1, not_considered: 0 }

function isImportance(value: string): value is Importance {
  return (IMPORTANCE_LEVELS as readonly string[]).includes(value)
}

function Dots({ level }: { level: Importance }) {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[0, 1, 2].map((index) => (
        <span key={index} className={`size-2 rounded-full ${index < FILLED[level] ? "bg-primary" : "bg-border"}`} />
      ))}
    </span>
  )
}

/** How much each factor weighs in the decision: a four-level indicator per row and a legend. */
export function FactorsTable({ factors }: { factors: AdmissionImportanceFactor[] }) {
  const t = useT("chooserDetails")
  return (
    <div className="flex flex-col gap-2" data-testid="factors">
      <h3 className="text-sm font-semibold">{t("factors.title")}</h3>
      <ul className="border-hairline-strong rounded-card divide-y border text-sm" aria-label={t("factors.title")}>
        {factors.map((factor) => {
          const level = isImportance(factor.importance) ? factor.importance : "considered"
          return (
            <li key={factor.key} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="text-muted-foreground">{factor.label}</span>
              <span className="flex shrink-0 items-center gap-2">
                <Dots level={level} />
                <span className="font-medium">{t(`importance.${level}`)}</span>
              </span>
            </li>
          )
        })}
      </ul>
      <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label={t("factors.legend")}>
        {IMPORTANCE_LEVELS.map((level) => (
          <li key={level} className="flex items-center gap-1.5">
            <Dots level={level} />
            {t(`importance.${level}`)}
          </li>
        ))}
      </ul>
    </div>
  )
}
