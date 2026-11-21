"use client"

import { useT } from "@ihsp/i18n"
import { Button, buttonVariants, cn, Icons, Pill } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { useEssayLabel } from "../components/supp-label"
import type { EssaySummary } from "../api"
import type { MatchSlot, MatchTable } from "../flow/steps-api"
import { ShortAnswerField } from "./short-answer"
import { isPersonalSlot, isShortSlot, promptHead } from "./slot-model"

export const dropId = (universityId: string, slot: string) => `${universityId}::${slot}`

/** One slot of one university: what it asks, the essay in it with its length against the limit, and the actions. */
export function SlotCard({
  table,
  slot,
  essay,
  over,
  droppable,
  busy,
  onPick,
  onClear,
  onPreview,
  onCopy,
  onWrite,
}: {
  table: MatchTable
  slot: MatchSlot
  /** The summary of the assigned essay, when it is known. */
  essay: EssaySummary | undefined
  over: boolean
  droppable: boolean
  busy: boolean
  onPick: () => void
  onClear: () => void
  onPreview: () => void
  onCopy: () => void
  onWrite: () => void
}) {
  const t = useT("essayLedger")
  const te = useT("essays")
  const { label } = useEssayLabel()
  const [open, setOpen] = useState(false)
  const a = slot.assigned
  const tooLong = a?.over_limit === true
  const personal = isPersonalSlot(slot)
  const title = slot.shared
    ? t("commonApp")
    : personal
      ? t("slotPersonal")
      : (promptHead(slot.prompt) ?? t("slotExtra"))
  const words = a?.word_count ?? 0
  return (
    <li
      data-drop-slot={dropId(table.institution_id, slot.slot)}
      data-testid={`slot-${table.institution_id}-${slot.slot}`}
      className={cn(
        "bg-card flex min-w-0 flex-col gap-2 rounded-md border p-3 transition-colors",
        a && !tooLong && "border-success/40",
        tooLong && "border-warning/60",
        !a && "border-dashed",
        droppable && "border-primary/60 bg-primary/5",
        over && "border-primary bg-primary/10 ring-primary/40 ring-2",
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <h4 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h4>
        {slot.required ? (
          <Pill tone="neutral" className="h-5 px-2 text-xs">
            {t("required")}
          </Pill>
        ) : (
          <span className="text-muted-foreground text-xs">{t("optional")}</span>
        )}
        {slot.word_limit ? (
          <span className="text-muted-foreground text-xs">{t("limitUpTo", { count: slot.word_limit })}</span>
        ) : null}
      </div>
      {slot.shared ? (
        <p className="text-primary text-xs font-medium">{t("sharedAll")}</p>
      ) : personal ? (
        <p className="text-muted-foreground text-xs">{t("sharedCommonApp")}</p>
      ) : null}
      {slot.prompt ? (
        <div className="flex flex-col items-start gap-0.5">
          <p className={cn("text-muted-foreground text-xs italic", !open && "line-clamp-2")}>{slot.prompt}</p>
          {slot.prompt.length > 120 ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-primary text-xs font-medium"
              aria-expanded={open}
            >
              {t(open ? "promptLess" : "promptMore")}
            </button>
          ) : null}
        </div>
      ) : null}
      {isShortSlot(slot) ? (
        <ShortAnswerField slot={slot} />
      ) : a ? (
        <>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <Icons.check aria-hidden className={cn("size-4 shrink-0", tooLong ? "text-warning" : "text-success")} />
            <span className="min-w-0 truncate font-medium">{essay ? label(essay) : a.title || te("untitled")}</span>
            <span
              className={cn("text-xs tabular-nums", tooLong ? "text-warning font-medium" : "text-muted-foreground")}
            >
              {slot.word_limit
                ? te("wordsOf", { count: words, limit: slot.word_limit })
                : te("words", { count: words })}
            </span>
            {tooLong && slot.word_limit ? (
              <Pill tone="warning" className="h-5 px-2 text-xs">
                {t("overBy", { count: words - slot.word_limit })}
              </Pill>
            ) : null}
            {essay?.uniqueness != null ? (
              <span className="text-muted-foreground text-xs">· {t("score", { value: essay.uniqueness })}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={onPreview} className="min-h-9">
              <Icons.eye aria-hidden />
              {t("preview")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onCopy} className="min-h-9">
              <Icons.copy aria-hidden />
              {t("copy")}
            </Button>
            <Link
              href={`/essays/edit/?id=${encodeURIComponent(a.essay_id)}`}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }), "min-h-9")}
            >
              <Icons.edit aria-hidden />
              {t("open")}
            </Link>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onPick} className="min-h-9">
              {t("change")}
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={busy}
              onClick={onClear}
              aria-label={t("clearAria", { title: a.title })}
              className="size-9"
            >
              <Icons.close aria-hidden />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground mr-auto text-sm">{t("slotEmpty")}</span>
          <Button type="button" size="sm" disabled={busy} onClick={onPick} className="min-h-9">
            {t("chooseEssay")}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onWrite} className="min-h-9">
            <Icons.add aria-hidden />
            {t("writeNew")}
          </Button>
        </div>
      )}
    </li>
  )
}
