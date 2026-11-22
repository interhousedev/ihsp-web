"use client"

import { formatDate, useT } from "@ihsp/i18n"
import { cn, Skeleton } from "@ihsp/ui"
import { usePracticeHistory, usePracticeToday } from "../../flow/api"
import { totalOf } from "./practice-score"
import { useThemeLabel } from "./theme-label"

/** Every day written so far, newest first, today on top; picking a day loads it read-only (today stays editable). */
export function PracticeHistory({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (day: string | null) => void
}) {
  const t = useT("essayPractice")
  const today = usePracticeToday()
  const history = usePracticeHistory()
  const todayDay = today.data?.day
  const todayTotal = totalOf(today.data?.entry)
  const past = (history.data?.items ?? []).filter((e) => e.day !== todayDay)
  if (today.isPending || history.isPending) return <Skeleton className="m-3 h-40" />
  return (
    <ul className="flex flex-col p-1.5" data-testid="practice-history">
      {todayDay ? (
        <li>
          <DayButton
            active={selected === null}
            label={t("todayShort")}
            theme={today.data?.theme ?? ""}
            total={todayTotal}
            onClick={() => onSelect(null)}
          />
        </li>
      ) : null}
      {past.map((e) => (
        <li key={e.day}>
          <DayButton
            active={selected === e.day}
            label={formatDate(e.day, undefined, { day: "numeric", month: "long" })}
            theme={e.theme}
            total={totalOf(e)}
            onClick={() => onSelect(e.day)}
          />
        </li>
      ))}
      {past.length === 0 ? <li className="text-muted-foreground px-3 py-2 text-sm">{t("historyEmpty")}</li> : null}
    </ul>
  )
}

function DayButton({
  active,
  label,
  theme,
  total,
  onClick,
}: {
  active: boolean
  label: string
  theme: string
  total: number | null
  onClick: () => void
}) {
  const themeLabel = useThemeLabel()
  return (
    <button
      type="button"
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      className={cn(
        "hover:bg-accent/60 focus-visible:ring-ring flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:outline-none",
        active && "bg-accent",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2.5 shrink-0 rounded-full border-2",
          total !== null ? "bg-primary border-primary" : "border-hairline-strong",
        )}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{label}</span>
        <span className="text-muted-foreground truncate text-xs">{themeLabel(theme)}</span>
      </span>
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        {total !== null ? `${total}/20` : "—"}
      </span>
    </button>
  )
}
