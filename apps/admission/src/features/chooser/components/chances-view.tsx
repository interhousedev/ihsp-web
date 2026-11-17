"use client"

import { useT } from "@ihsp/i18n"
import { Icons, StateView, cn } from "@ihsp/ui"
import { AiTabCard } from "@/components/ai-tab-card"
import Link from "next/link"
import type { AdmissionChanceFactor as ChanceFactor } from "@ihsp/api"
import { useChances } from "../../discover/hooks"
import { useUniSuggestions } from "../hooks"
import { StatusPill } from "../../discover/components/status-pill"
import { ChanceChart } from "./chance-chart"
import { useOptionLabel } from "./option-label"

const LEVEL_CLASS: Record<ChanceFactor["level"], string> = {
  strong: "border-success/40 bg-success-muted text-success",
  ok: "border-warning/40 bg-warning-muted text-warning",
  weak: "border-destructive/40 bg-destructive/10 text-destructive",
  unknown: "border-hairline-strong bg-muted text-muted-foreground",
}

const REQUIRED: Record<ChanceFactor["key"], string[]> = {
  academics: ["yours", "median"],
  course_rigor: ["advanced", "total"],
  cost: ["cost", "budget"],
  location: ["country"],
  activities: ["count"],
}

export function FactorCard({ factor }: { factor: ChanceFactor }) {
  const t = useT("chooser")
  const countryName = useOptionLabel("country")
  const params: Record<string, string | number> = {}
  for (const [name, value] of Object.entries(factor.detail?.params ?? {})) {
    if (value !== null && value !== undefined) params[name] = name === "country" ? countryName(String(value)) : value
  }
  const showDetail = REQUIRED[factor.key].every((name) => name in params)
  return (
    <li
      data-testid={`factor-${factor.key}`}
      data-level={factor.level}
      className="bg-card border-hairline-strong rounded-card flex flex-col gap-2 border p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t(`chances.factors.${factor.key}`)}
        </h3>
        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", LEVEL_CLASS[factor.level])}>
          {t(`chances.levels.${factor.level}`)}
        </span>
      </div>
      <p className="text-sm">{t(`chances.text.${factor.key}.${factor.level}`)}</p>
      {showDetail ? <p className="text-muted-foreground text-xs">{t(`chances.detail.${factor.key}`, params)}</p> : null}
      {params.estimated === 1 ? <p className="text-muted-foreground text-xs">{t("chances.estimated")}</p> : null}
      {factor.action ? (
        <Link href={factor.action.href} className="text-primary inline-flex items-center gap-1 text-sm font-medium">
          {t("chances.action")}
          <Icons.arrowRight aria-hidden className="size-4" />
        </Link>
      ) : null}
    </li>
  )
}

const STRENGTHEN_KEYS = ["academics", "course_rigor", "activities"] as const

/**
 * "What to strengthen": the academic and activity factors that are not strong yet, each with what to do and a link to
 * the place to do it. Built from the factors the backend computed; nothing is invented here.
 */
export function StrengthenCard({ factors, institutionId }: { factors: ChanceFactor[]; institutionId: string }) {
  const t = useT("chooser")
  const ai = useUniSuggestions(institutionId).data
  const questions = ai?.questions ?? []
  const sections = [
    { key: "academic", items: ai?.academic ?? [] },
    { key: "activities", items: ai?.activities ?? [] },
  ].filter((section) => section.items.length > 0)
  const items = factors.filter(
    (factor) => (STRENGTHEN_KEYS as readonly string[]).includes(factor.key) && factor.level !== "strong",
  )
  return (
    <AiTabCard
      role="region"
      aria-labelledby="strengthen-title"
      label={t("strengthen.tab")}
      icon={<Icons.sparkles aria-hidden />}
    >
      <h3 id="strengthen-title" className="text-sm font-semibold">
        {t("strengthen.title")}
      </h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("strengthen.none")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((factor) => (
            <li key={factor.key} data-testid={`strengthen-${factor.key}`} className="flex flex-col gap-1">
              <span className="text-sm font-medium">{t(`chances.factors.${factor.key}`)}</span>
              <span className="text-muted-foreground text-sm">
                {t(`strengthen.advice.${factor.key}.${factor.level}`)}
              </span>
              {factor.action ? (
                <Link
                  href={factor.action.href}
                  className="text-primary inline-flex items-center gap-1 text-sm font-medium"
                >
                  {t("chances.action")}
                  <Icons.arrowRight aria-hidden className="size-4" />
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {sections.map((section) => (
        <div key={section.key} className="flex flex-col gap-2" data-testid={`ai-${section.key}`}>
          <h4 className="text-sm font-medium">{t(`strengthen.ai.${section.key}`)}</h4>
          <ul className="flex flex-col gap-2 text-sm">
            {section.items.map((item) => (
              <li key={item.title} className="flex flex-col">
                <span className="font-medium">{item.title}</span>
                <span className="text-muted-foreground">{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {questions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">{t("strengthen.ask")}</h4>
          <ul data-testid="strengthen-suggestions" className="text-muted-foreground flex flex-col gap-1 text-sm">
            {questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </AiTabCard>
  )
}

/** "What shapes your chances": status, five factor cards and the what-if chart. */
export function ChancesView({ institutionId }: { institutionId: string }) {
  const t = useT("chooser")
  const query = useChances(institutionId)
  if (query.isLoading) return <StateView state="loading" rows={3} />
  if (query.isError || !query.data)
    return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  const chances = query.data
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {chances.status ? <StatusPill status={chances.status} /> : null}
        <p className="text-sm">{t(`chances.summary.${chances.summary_key}`)}</p>
      </div>
      <h2 className="text-base font-semibold">{t("chances.title")}</h2>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {chances.factors.map((factor) => (
          <FactorCard key={factor.key} factor={factor} />
        ))}
      </ul>
      <StrengthenCard factors={chances.factors} institutionId={institutionId} />
      <ChanceChart simulation={chances.simulation} />
    </div>
  )
}
