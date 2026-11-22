"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Button, cn, Icons, Pill, Skeleton, StateView } from "@ihsp/ui"
import { CoachError } from "../coach-error"
import { useState } from "react"
import { useReadHistory, useStoredRead, type DeepRead, type ParagraphStrength } from "../../flow/steps-api"
import { ReadUnisStrip } from "./read-unis-strip"
import type { ReadState } from "./read-state"
import { ScoreRing } from "./score-bar"

const TONE = { strong: "success", ok: "neutral", weak: "warning" } as const
/** The dimensions the model names for the weakest spot; an unknown one is left out rather than shown in English. */
const DIMENSIONS = ["detail", "voice", "structure", "originality", "imagery"]

const BAR: Record<ParagraphStrength, string> = {
  strong: "bg-success",
  ok: "bg-muted-foreground/50",
  weak: "bg-warning",
}

function Uniqueness({ read }: { read: DeepRead }) {
  const t = useT("essayFlow")
  return (
    <div className="bg-card border-hairline rounded-card flex flex-wrap items-center gap-3 border p-3">
      <ScoreRing
        value={read.uniqueness}
        label={t("deep.uniquenessLabel", { value: read.uniqueness })}
        className="size-20"
      />
      <div className="min-w-0 flex-1 basis-40">
        <h3 className="text-sm font-semibold">{t("deep.uniqueness")}</h3>
        <p className="mt-1 text-sm">{read.uniqueness_note}</p>
        {read.tropes.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t("deep.tropes")}>
            {read.tropes.map((trope) => (
              <li key={trope}>
                <Pill tone="warning">{trope}</Pill>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

function ReadBody({
  read,
  selected,
  onSelect,
}: {
  read: DeepRead
  selected: number | null
  onSelect: (paragraph: number | null) => void
}) {
  const t = useT("essayFlow")
  const te = useT("essayEditor")
  const weakest = read.paragraphs.find((p) => p.paragraph === read.fix_paragraph)?.strength === "weak"
  const dimension = read.fix_dimension.trim().toLowerCase()
  const fixWhere = weakest
    ? DIMENSIONS.includes(dimension)
      ? te("fixWhereDim", { paragraph: read.fix_paragraph, dimension: te(`dim.${dimension}` as "dim.detail") })
      : te("fixWhere", { paragraph: read.fix_paragraph })
    : null
  return (
    <>
      <Uniqueness read={read} />
      <div className="bg-warning-muted/40 border-hairline rounded-card flex flex-col gap-1.5 border p-3">
        <h3 className="text-sm font-semibold">{t("deep.fix")}</h3>
        {fixWhere ? (
          <button
            type="button"
            onClick={() => onSelect(read.fix_paragraph)}
            className="text-muted-foreground text-left text-xs underline"
          >
            {fixWhere}
          </button>
        ) : null}
        <p className="text-sm">{read.fix_problem}</p>
        <p className="text-sm">
          <span className="font-semibold">{t("deep.fixTry")} </span>
          {read.fix_try}
        </p>
      </div>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{t("deep.paragraphs")}</h3>
        <ol className="flex flex-col gap-1.5">
          {read.paragraphs.map((p) => (
            <li key={p.paragraph}>
              <button
                type="button"
                aria-pressed={selected === p.paragraph}
                onClick={() => onSelect(selected === p.paragraph ? null : p.paragraph)}
                className={cn(
                  "bg-card border-hairline rounded-card flex w-full gap-3 border p-2.5 text-left",
                  selected === p.paragraph && "ring-primary/50 ring-2",
                )}
              >
                <span aria-hidden className={cn("w-1 shrink-0 rounded-full", BAR[p.strength])} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-muted-foreground text-xs font-medium">
                      {t("deep.paragraph", { n: p.paragraph })}
                    </span>
                    <Pill tone="primary">{t(`deep.roles.${p.role}` as "deep.roles.hook")}</Pill>
                    <Pill tone={TONE[p.strength]}>{t(`deep.strength.${p.strength}` as "deep.strength.ok")}</Pill>
                  </span>
                  <span className="mt-1 block text-sm">{p.reveals}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
      {read.moments.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t("deep.moments")}</h3>
          <ul className="flex flex-col gap-2">
            {read.moments.map((m) => (
              <li
                key={`${m.paragraph}-${m.quote}`}
                className="bg-card border-hairline rounded-card flex flex-col gap-1 border p-2.5"
              >
                <div className="flex items-center gap-1.5">
                  <Pill tone="success">{t(`deep.kind.${m.kind}` as "deep.kind.fresh")}</Pill>
                  <span className="text-muted-foreground text-xs">{t("deep.paragraph", { n: m.paragraph })}</span>
                </div>
                <blockquote className="border-success/50 border-l-2 pl-2 text-sm italic">“{m.quote}”</blockquote>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}

/** The past reads of the essay: pick one to see it read-only; the newest carries a "latest" badge. */
function History({
  essayId,
  selected,
  onSelect,
  onClose,
}: {
  essayId: string
  selected: number | null
  onSelect: (paragraph: number | null) => void
  onClose: () => void
}) {
  const t = useT("essayFlow")
  const fmt = useFormatters()
  const list = useReadHistory(essayId, true)
  const [readId, setReadId] = useState<string | null>(null)
  const one = useStoredRead(essayId, readId)
  const items = list.data ?? []
  return (
    <div className="flex flex-col gap-3" data-testid="read-history">
      <div className="flex items-center gap-1">
        <Button type="button" size="sm" variant="ghost" onClick={readId ? () => setReadId(null) : onClose}>
          <Icons.chevronLeft aria-hidden />
          {readId ? t("deep.history") : t("deep.historyBack")}
        </Button>
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{t("deep.history")}</h3>
      </div>
      {readId ? (
        one.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : one.isError ? (
          <StateView state="error" error={one.error} onRetry={() => void one.refetch()} />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              {t("deep.historyOf", { date: fmt.dateTime(new Date(one.data.created_at)) })}
              {one.data.latest ? <Pill tone="success">{t("deep.latest")}</Pill> : null}
            </p>
            <ReadBody read={one.data.read} selected={selected} onSelect={onSelect} />
          </div>
        )
      ) : list.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : list.isError ? (
        <StateView state="error" error={list.error} onRetry={() => void list.refetch()} />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("deep.historyEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setReadId(item.id)}
                className="bg-card border-hairline rounded-card flex min-h-11 w-full flex-col gap-0.5 border p-2.5 text-left"
              >
                <span className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-medium">{fmt.dateTime(new Date(item.created_at))}</span>
                  {i === 0 ? <Pill tone="success">{t("deep.latest")}</Pill> : null}
                  {item.words > 0 ? (
                    <span className="text-muted-foreground">{t("deep.historyWords", { count: item.words })}</span>
                  ) : null}
                </span>
                {item.summary ? <span className="line-clamp-2 text-sm">{item.summary}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** The Read tab: the universities to read for, what the stripes on the text mean, the one fix and the moments. */
export function ReadPanel({
  essayId,
  state,
  selected,
  onSelect,
}: {
  essayId: string
  state: ReadState
  selected: number | null
  onSelect: (paragraph: number | null) => void
}) {
  const t = useT("essayFlow")
  const te = useT("essayEditor")
  const [showHistory, setShowHistory] = useState(false)
  const { query, run, read, stale, start, unis } = state
  if (query.isPending) return <Skeleton className="h-48 w-full" />
  if (query.isError) return <StateView state="error" error={query.error} onRetry={() => void query.refetch()} />
  if (showHistory)
    return <History essayId={essayId} selected={selected} onSelect={onSelect} onClose={() => setShowHistory(false)} />
  const button = (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant={stale || !read ? "default" : "outline"}
        disabled={run.isPending}
        onClick={() => void start()}
      >
        <Icons.sparkles aria-hidden />
        {run.isPending ? t("deep.running") : read ? t("deep.rerun") : t("deep.run")}
      </Button>
      <span className="text-muted-foreground text-xs">{t("deep.runHint")}</span>
      <CoachError error={run.error} />
    </div>
  )
  const historyButton = (
    <Button type="button" size="sm" variant="ghost" className="self-start" onClick={() => setShowHistory(true)}>
      <Icons.clock aria-hidden />
      {t("deep.history")}
    </Button>
  )
  if (!read)
    return (
      <div className="flex flex-col gap-3" data-testid="read-panel">
        <ReadUnisStrip unis={unis} hasRead={false} />
        <p className="text-sm">{te("readNone")}</p>
        {historyButton}
        {button}
      </div>
    )
  return (
    <div className="flex flex-col gap-4" data-testid="read-panel">
      <ReadUnisStrip unis={unis} hasRead />
      {historyButton}
      <ReadBody read={read} selected={selected} onSelect={onSelect} />
      {button}
    </div>
  )
}
