"use client"

import { useT } from "@ihsp/i18n"
import { IconEye, Pill, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { useState } from "react"
import type { WorkCheckResult } from "../hooks/use-ai-tools"

const TONE = { low: "success", mid: "warning", high: "danger" } as const

/** The check of one work: points per criterion, and the passages that look machine-written. Only the teacher sees it. */
export function WorkCheckResultView({ result, source }: { result: WorkCheckResult; source?: string }) {
  const t = useT("aiTools")
  const [tab, setTab] = useState<"criteria" | "ai">("criteria")
  const { result: check, authorship } = result
  const verdict = authorship.verdict === "mid" || authorship.verdict === "high" ? authorship.verdict : "low"
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <IconEye className="size-4 shrink-0" aria-hidden />
        {source ? <span>{source} ·</span> : null}
        <span>{t("workCheck.teacherOnly")}</span>
      </p>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "criteria" | "ai")}>
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="criteria" className="flex-1">
            {t("workCheck.tabCriteria")}
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1">
            {t("workCheck.tabAi")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "criteria" ? (
        <div className="flex flex-col gap-3">
          {check.score !== null && check.max_score !== null ? (
            <Pill tone="primary" className="h-9 self-start px-4 text-base">
              {t("workCheck.score", { score: check.score, max: check.max_score })}
            </Pill>
          ) : null}
          <p className="leading-relaxed">{check.summary}</p>
          {(
            [
              ["strengths", check.strengths],
              ["issues", check.issues],
              ["suggestions", check.suggestions],
            ] as const
          ).map(([key, items]) =>
            items.length > 0 ? (
              <div key={key} className="bg-muted/50 flex flex-col gap-1 rounded-lg p-3">
                <span className="font-medium">{t(`workCheck.${key}`)}</span>
                <ul className="text-muted-foreground list-disc ps-5 text-sm">
                  {items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone={TONE[verdict]} className="h-8 px-3 text-sm">
              {t(`workCheck.verdict.${verdict}`)}
            </Pill>
            <span className="text-sm">{authorship.caveat || t("workCheck.caveat")}</span>
          </div>
          {authorship.signals.length > 0 ? (
            <ul className="text-muted-foreground list-disc ps-5 text-sm">
              {authorship.signals.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  )
}
