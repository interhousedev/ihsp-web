"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, Pill } from "@ihsp/ui"
import { useStoredReviews } from "../../flow/steps-api"
import type { ReadState } from "./read-state"

/** A ring filled in proportion to a 0-100 score; the number sits in the middle. */
export function ScoreRing({ value, label, className = "size-28" }: { value: number; label: string; className?: string }) {
  const r = 44
  const c = 2 * Math.PI * r
  const v = Math.min(100, Math.max(0, value))
  return (
    <svg viewBox="0 0 108 108" role="img" aria-label={label} className={`text-primary shrink-0 ${className}`}>
      <circle cx="54" cy="54" r={r} fill="none" stroke="var(--color-hairline)" strokeWidth="10" />
      <circle
        cx="54"
        cy="54"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${(c * v) / 100} ${c}`}
        transform="rotate(-90 54 54)"
      />
      <text x="54" y="67" textAnchor="middle" className="fill-foreground text-[38px] font-semibold">
        {value}
      </text>
    </svg>
  )
}

const MAX_CHIPS = 4

/** The one uniqueness score of the essay and, beside it, how well it fits each university it targets. */
export function ScoreBar({ essayId, state, onUnis, onRead }: { essayId: string; state: ReadState; onUnis: () => void; onRead: () => void }) {
  const t = useT("essayEditor")
  const stored = useStoredReviews(essayId)
  const unis = stored.data?.universities ?? []
  const { read, stale } = state
  return (
    <div data-testid="score-bar" className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
      {read ? (
        <button
          type="button"
          onClick={onRead}
          className="flex items-center gap-2 rounded-full text-left"
          aria-label={t("scoreLabel", { value: read.uniqueness })}
        >
          <ScoreRing value={read.uniqueness} label={t("scoreLabel", { value: read.uniqueness })} className="size-10" />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-medium">{t("score")}</span>
            {stale ? <span className="text-warning text-xs">{t("scoreStale")}</span> : null}
          </span>
        </button>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={onRead}>
          <Icons.sparkles aria-hidden />
          {t("readNow")}
        </Button>
      )}
      {unis.length > 0 ? (
        <ul className="hidden min-w-0 flex-wrap items-center gap-1.5 sm:flex" aria-label={t("fitChips")}>
          {unis.slice(0, MAX_CHIPS).map((u) => (
            <li key={u.institution_id}>
              <button type="button" onClick={onUnis} className="rounded-full">
                <Pill tone={u.review.alignment >= 70 ? "success" : u.review.alignment >= 45 ? "neutral" : "warning"}>
                  <span className="max-w-32 truncate">{u.name}</span>
                  <span className="tabular-nums">{u.review.alignment}</span>
                </Pill>
              </button>
            </li>
          ))}
          {unis.length > MAX_CHIPS ? (
            <li>
              <button type="button" onClick={onUnis} className="text-muted-foreground text-xs underline">
                {t("chipsMore", { count: unis.length - MAX_CHIPS })}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
