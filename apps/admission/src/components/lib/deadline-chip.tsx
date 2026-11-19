"use client"

import { useT } from "@ihsp/i18n"
import { cn, Pill } from "@ihsp/ui"
import { daysLeft, deadlineTone } from "../../lib/deadline-tone"
import { useNow } from "../../lib/use-now"

/** Destructive text class for a date that is urgent (within 30 days, Asia/Tashkent); empty otherwise. */
export function useDeadlineClass(date: string | null | undefined): string {
  const now = useNow(60_000)
  return deadlineTone(date, now) === "urgent" ? "text-destructive font-medium" : ""
}

/** "N days left" chip, shown only when `date` is urgent. */
export function DeadlineChip({ date, className }: { date: string | null | undefined; className?: string }) {
  const t = useT("chooser")
  const now = useNow(60_000)
  if (!date || deadlineTone(date, now) !== "urgent") return null
  return (
    <Pill tone="danger" className={cn("h-auto min-w-0 whitespace-normal text-left tabular-nums", className)}>
      {t("daysLeft", { count: daysLeft(date, now) })}
    </Pill>
  )
}

/** A formatted date that turns destructive when urgent, followed by the "N days left" chip. */
export function DeadlineDate({ date, text, className }: { date: string; text: string; className?: string }) {
  const tone = useDeadlineClass(date)
  return (
    <>
      <span className={cn(tone, className)}>{text}</span>
      <DeadlineChip date={date} />
    </>
  )
}
