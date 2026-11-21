"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import { LogoAvatar } from "../../../components/lib/photo-header"
import { FitRingButton } from "../../fit/components/fit-ring-button"
import { composite, METRIC_IDS, METRIC_STYLE, type UniFit } from "../../fit/fit-model"
import { buildFit, MOCK_UNIS, type MockUniId } from "../../fit/mock-fit"
import { useMockLogos } from "../../today/use-logos"
import type { Weights } from "../weights-model"

const ROW = 64
const SHOWN = 5
const FITS: Record<MockUniId, UniFit> = Object.fromEntries(MOCK_UNIS.map((u) => [u.id, buildFit(u.raw, {})])) as Record<
  MockUniId,
  UniFit
>

/** The plain-words sentence and the four weights as bars in the fit-ring colours. */
export function WeightsSummary({ sentence, weights, className }: { sentence: string; weights: Weights; className?: string }) {
  const t = useT("weightsLab.summary")
  const fit = useT("fit")
  return (
    <section aria-labelledby="weights-summary" className={cn("flex flex-col gap-3", className)}>
      <h2 id="weights-summary" className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {t("title")}
      </h2>
      <p aria-live="polite" className="text-lg leading-snug font-semibold text-balance">
        {sentence}
      </p>
      <ul aria-label={t("weights")} className="flex flex-col gap-1.5">
        {METRIC_IDS.map((id) => (
          <li key={id} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs">
            <span className="truncate">{fit(`metric.${id}.name`)}</span>
            <span className="bg-muted h-2 overflow-hidden rounded-full">
              <span
                className="block h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${Math.round(weights[id] * 100)}%`, background: METRIC_STYLE[id].color }}
              />
            </span>
            <span className="text-muted-foreground text-right tabular-nums">{Math.round(weights[id] * 100)}%</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * The top five of the mock universities for the given weights. Rows are absolutely placed by rank and slide with a
 * transform transition (instant under reduced motion); the sixth waits invisibly below and swaps in when it climbs.
 */
export function TopUniversities({ weights, className }: { weights: Weights; className?: string }) {
  const t = useT("weightsLab.top")
  const logos = useMockLogos()
  const ranked = MOCK_UNIS.map((uni) => ({ uni, value: composite(FITS[uni.id].metrics, weights).value ?? 0 })).sort(
    (a, b) => b.value - a.value,
  )
  return (
    <section aria-labelledby="weights-top" className={cn("flex flex-col gap-2", className)}>
      <h2 id="weights-top" className="text-base font-semibold">
        {t("title")}
      </h2>
      <ol className="relative" style={{ height: ROW * SHOWN }}>
        {MOCK_UNIS.map((uni) => {
          const rank = ranked.findIndex((r) => r.uni.id === uni.id)
          const shown = rank < SHOWN
          const logo = logos[uni.id]
          return (
            <li
              key={uni.id}
              aria-hidden={!shown}
              className="absolute inset-x-0 top-0 flex items-center gap-3 transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none"
              style={{
                height: ROW,
                transform: `translateY(${rank * ROW}px)`,
                opacity: shown ? 1 : 0,
                pointerEvents: shown ? "auto" : "none",
              }}
            >
              <span className="text-muted-foreground w-4 text-center text-sm tabular-nums">{shown ? rank + 1 : ""}</span>
              <FitRingButton name={uni.name} fit={FITS[uni.id]} weights={weights} size={52}>
                <LogoAvatar name={uni.short} src={logo?.src} fit={logo?.fit} zoom={logo?.zoom} className="size-full ring-0" />
              </FitRingButton>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{uni.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {t("score", { value: ranked[rank]!.value })}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="text-muted-foreground text-xs">{t("note")}</p>
    </section>
  )
}
