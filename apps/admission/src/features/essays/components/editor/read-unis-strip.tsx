"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons } from "@ihsp/ui"
import { useState } from "react"
import type { UniEntry } from "../../flow/steps-api"
import { UniLogo } from "../../ledger/uni-logo"
import { useInstitution } from "../../../chooser/hooks"
import { CoachError } from "../coach-error"
import type { ReadUnis } from "./read-unis"

function UniChip({
  id,
  unis,
  hasRead,
  open,
  onClick,
}: {
  id: string
  unis: ReadUnis
  hasRead: boolean
  open: boolean
  onClick: () => void
}) {
  const t = useT("essayFlow")
  const name = useInstitution(id).data?.name ?? ""
  const on = unis.isSelected(id)
  const busy = unis.pending.includes(id)
  const done = unis.reviewed.has(id)
  const state = busy ? t("deep.uniBusy") : done ? t("deep.uniReviewed") : on ? t("deep.uniOn") : t("deep.uniOff")
  return (
    <li className="shrink-0">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-pressed={on}
        aria-label={`${name}, ${state}`}
        title={name}
        data-testid="read-uni"
        className={cn(
          "press relative flex size-12 min-h-11 min-w-11 items-center justify-center rounded-full p-0.5 transition",
          "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
          on ? "ring-success ring-2" : "opacity-60 brightness-75 grayscale",
          open && "ring-offset-card ring-offset-2",
        )}
      >
        <UniLogo id={id} name={name || "?"} size="lg" />
        {busy ? (
          <span className="bg-card/70 absolute inset-0 flex items-center justify-center rounded-full">
            <Icons.sparkles aria-hidden className="size-4 animate-pulse" />
          </span>
        ) : null}
        {hasRead && on && done ? (
          <Icons.check
            aria-hidden
            className="bg-success text-white absolute -right-0.5 -bottom-0.5 size-4 rounded-full p-0.5"
          />
        ) : null}
      </button>
    </li>
  )
}

function List({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="text-xs font-medium">{label}</p>
      <ul className="text-muted-foreground list-disc pl-4 text-xs">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  )
}

/** One reviewed university: how its admissions officer may react, then the alignment and the tips. */
function UniReaction({ entry, onExclude }: { entry: UniEntry; onExclude: () => void }) {
  const t = useT("essayFlow")
  const r = entry.review
  const ao = r.ao_reaction
  return (
    <div
      data-testid="read-uni-panel"
      className={cn("bg-card border-hairline rounded-card flex flex-col gap-2 border p-3", entry.stale && "opacity-70")}
    >
      <h4 className="text-sm font-semibold">{entry.name}</h4>
      {ao ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium">{t("deep.ao")}</p>
          <p className="text-sm">{ao.summary}</p>
          <List items={ao.likely_positive} label={t("deep.aoPositive")} />
          <List items={ao.likely_concerns} label={t("deep.aoConcerns")} />
        </div>
      ) : null}
      {r.sourced ? (
        <div className="flex items-center gap-2" role="img" aria-label={t("deep.alignment", { value: r.alignment })}>
          <div className="bg-hairline h-2 flex-1 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, r.alignment))}%` }}
            />
          </div>
          <span className="text-sm font-semibold tabular-nums">{r.alignment}</span>
        </div>
      ) : null}
      {r.fit_summary ? <p className="text-sm">{r.fit_summary}</p> : null}
      <List items={r.risks} label={t("deep.risks")} />
      <List items={r.supplement_tips} label={t("deep.tips")} />
      {entry.stale ? <p className="text-muted-foreground text-xs">{t("deep.stale")}</p> : null}
      <Button type="button" size="sm" variant="ghost" className="self-start" onClick={onExclude}>
        {t("deep.uniExclude")}
      </Button>
    </div>
  )
}

/**
 * The student's universities as round logos above the run button. A click includes or excludes one; once a read
 * exists a reviewed logo opens its reaction panel and an included but unreviewed one is reviewed on its own.
 */
export function ReadUnisStrip({ unis, hasRead }: { unis: ReadUnis; hasRead: boolean }) {
  const t = useT("essayFlow")
  const [open, setOpen] = useState<string | null>(null)
  if (unis.institutionIds.length === 0) return null
  const click = (id: string) => {
    if (!unis.isSelected(id)) return unis.setSelected(id, true)
    if (!hasRead) return unis.setSelected(id, false)
    if (unis.reviewed.has(id)) return setOpen(open === id ? null : id)
    void unis.runOne(id)
  }
  const entry = open ? unis.reviewed.get(open) : undefined
  return (
    <section className="flex flex-col gap-2" data-testid="read-unis">
      <h3 className="text-sm font-semibold">{t("deep.unisTitle")}</h3>
      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1.5" aria-label={t("deep.unisTitle")}>
        {unis.institutionIds.map((id) => (
          <UniChip key={id} id={id} unis={unis} hasRead={hasRead} open={open === id} onClick={() => click(id)} />
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">{hasRead ? t("deep.unisHintRead") : t("deep.unisHint")}</p>
      <CoachError error={unis.error} />
      {entry ? (
        <UniReaction
          entry={entry}
          onExclude={() => {
            unis.setSelected(entry.institution_id, false)
            setOpen(null)
          }}
        />
      ) : null}
    </section>
  )
}
