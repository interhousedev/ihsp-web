"use client"

import { useT } from "@ihsp/i18n"
import { Badge, Icons, ResponsiveDialog, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ihsp/ui"
import { useState, type ReactNode } from "react"
import type { CoachCheck } from "../api"

/** The rubric bands as `[band, from, to]`; the same cut-offs the backend applies. */
export const CHECK_BANDS = [
  ["exceptional", 85, 100],
  ["strong", 60, 84],
  ["solid", 35, 59],
  ["developing", 15, 34],
  ["weak", 0, 14],
] as const

const DIMS = ["hook", "theme", "detail", "authenticity", "reflection", "writing"] as const
const BAND_TONE = {
  exceptional: "var(--color-success)",
  strong: "var(--color-success)",
  solid: "var(--color-info)",
  developing: "var(--color-warning)",
  weak: "var(--color-destructive)",
} as const
const FIT_VARIANT = { yes: "success", partial: "warning", no: "destructive", unknown: "neutral" } as const

/** A half ring filled from the left to the right in proportion to the 0-100 score. */
function Gauge({ score, label }: { score: number; label: string }) {
  const r = 52
  const arc = Math.PI * r
  const clamped = Math.min(100, Math.max(0, score))
  return (
    <svg viewBox="0 0 120 70" role="img" aria-label={label} className="w-40 max-w-full">
      <path
        d="M 8 64 A 52 52 0 0 1 112 64"
        fill="none"
        stroke="var(--color-hairline)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M 8 64 A 52 52 0 0 1 112 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${(arc * clamped) / 100} ${arc}`}
      />
      <text x="60" y="58" textAnchor="middle" className="fill-foreground text-[26px] font-semibold">
        {score}
      </text>
    </svg>
  )
}

function Dots({ score }: { score: number }) {
  return (
    <span aria-hidden className="flex gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={i < score ? "bg-primary size-2 rounded-full" : "bg-hairline size-2 rounded-full"} />
      ))}
    </span>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-card border-hairline rounded-card flex flex-col gap-1 border p-3">
      <h4 className="text-muted-foreground text-xs font-medium">{title}</h4>
      <p className="text-sm">{children}</p>
    </div>
  )
}

/** Explains the six dimensions, the 0-5 scale, the score formula and the bands. */
export function HowWeScoreDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT("essayCheck")
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={t("how.title")}>
      <div className="flex flex-col gap-3 text-sm">
        <p>{t("how.intro")}</p>
        <ul className="flex flex-col gap-2">
          {DIMS.map((d) => (
            <li key={d}>
              <span className="font-medium">{t(`dim.${d}`)}</span>
              <span className="text-muted-foreground"> · {t(`dimHint.${d}`)}</span>
            </li>
          ))}
        </ul>
        <p>{t("how.scale")}</p>
        <p>{t("how.formula")}</p>
        <ul className="flex flex-col gap-1">
          {CHECK_BANDS.map(([band, from, to]) => (
            <li key={band} className="flex justify-between gap-2">
              <span className="font-medium">{t(`band.${band}`)}</span>
              <span className="text-muted-foreground">{t("range", { from, to })}</span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground">{t("how.limits")}</p>
      </div>
    </ResponsiveDialog>
  )
}

/** The outcome of one essay check: score gauge, prompt fit, six rated dimensions and what to fix first. */
export function CheckResult({ data }: { data: CoachCheck }) {
  const t = useT("essayCheck")
  const [how, setHow] = useState(false)
  const rank = new Map(DIMS.map((d, i) => [d as string, i]))
  const dims = [...data.dimensions].sort((a, b) => (rank.get(a.dim) ?? 9) - (rank.get(b.dim) ?? 9))
  const band = data.band as keyof typeof BAND_TONE
  const dimName = (d: string) => ((DIMS as readonly string[]).includes(d) ? t(`dim.${d as (typeof DIMS)[number]}`) : d)
  return (
    <div className="flex flex-col gap-3 animate-in fade-in" data-testid="check-result">
      <div className="flex flex-col items-center gap-1">
        <div style={{ color: BAND_TONE[band] }}>
          <Gauge score={data.score} label={t("scoreLabel", { score: data.score })} />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <button type="button" className="text-sm font-medium underline decoration-dotted underline-offset-4" />
              }
            >
              {t(`band.${band}`)}
            </TooltipTrigger>
            <TooltipContent>
              <ul>
                {CHECK_BANDS.map(([b, from, to]) => (
                  <li key={b}>
                    {t(`band.${b}`)}: {t("range", { from, to })}
                  </li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <button
          type="button"
          onClick={() => setHow(true)}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
        >
          <Icons.info aria-hidden className="size-3.5" />
          {t("how.open")}
        </button>
      </div>
      {data.summary ? <p className="text-sm">{data.summary}</p> : null}
      {data.generic ? (
        <p role="status" className="bg-warning-muted text-warning rounded-card flex gap-2 p-3 text-sm">
          <Icons.warning aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("generic")}
        </p>
      ) : null}
      {data.over_limit && data.word_limit ? (
        <p role="status" className="bg-warning-muted text-warning rounded-card flex gap-2 p-3 text-sm">
          <Icons.warning aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t("overLimit", { count: data.word_count, limit: data.word_limit })}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground text-[13px]">{t("promptFit")}</span>
        <Badge variant={FIT_VARIANT[data.prompt_fit as keyof typeof FIT_VARIANT] ?? "neutral"}>
          {t(`fit.${data.prompt_fit as keyof typeof FIT_VARIANT}`)}
        </Badge>
        {data.prompt_fit_reason ? <span className="text-muted-foreground">{data.prompt_fit_reason}</span> : null}
      </div>
      <ul className="flex flex-col divide-y">
        {dims.map((d) => (
          <li key={d.dim} className="flex flex-col gap-1 py-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{dimName(d.dim)}</span>
              <span className="flex items-center gap-2">
                <Dots score={d.score} />
                <span className="text-muted-foreground w-8 text-right text-xs">{d.score}/5</span>
              </span>
            </div>
            {d.comment ? <p className="text-muted-foreground text-[13px]">{d.comment}</p> : null}
            {d.quote ? (
              <blockquote className="border-hairline-strong text-muted-foreground border-l-2 pl-3 text-[13px] italic">
                {d.quote}
              </blockquote>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-2">
        <Card title={t("strongest")}>{dimName(data.strongest)}</Card>
        <Card title={t("firstFix")}>{data.first_fix}</Card>
      </div>
      {data.flagged_text ? (
        <div className="bg-warning-muted border-warning/40 rounded-card flex flex-col gap-1 border p-3 text-sm">
          <h4 className="text-muted-foreground text-xs font-medium">{t("flagged")}</h4>
          <p className="whitespace-pre-wrap">{data.flagged_text}</p>
          {data.flagged_reason ? <p className="text-muted-foreground text-[13px]">{data.flagged_reason}</p> : null}
        </div>
      ) : null}
      <HowWeScoreDialog open={how} onOpenChange={setHow} />
    </div>
  )
}
