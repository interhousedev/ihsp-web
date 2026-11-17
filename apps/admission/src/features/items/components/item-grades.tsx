"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons } from "@ihsp/ui"
import { useGradeItem, type Item } from "../api"

const TONE: Record<string, string> = {
  A: "bg-success/15 text-success",
  B: "bg-success/10 text-success",
  C: "bg-warning-muted text-warning",
  D: "bg-destructive/10 text-destructive",
  E: "bg-destructive/15 text-destructive",
}

/** A rounded letter pill: `A`–`E`, green to red; `C` is amber. */
export function GradePill({ part, grade, tip }: { part: string; grade: string; tip?: string }) {
  const t = useT("items")
  return (
    <span
      role="img"
      aria-label={t("grade.label", { part, grade })}
      title={tip}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
        TONE[grade] ?? "bg-muted text-muted-foreground",
      )}
    >
      {part}
      <span className="font-semibold">{grade}</span>
    </span>
  )
}

/** The grade pills of one item with a regrade button; `tips` also prints the one-line advice under them. */
export function ItemGrades({ item, tips = false }: { item: Item; tips?: boolean }) {
  const t = useT("items")
  const grade = useGradeItem(item.id)
  const g = item.grade
  const label = grade.isPending ? t("grade.running") : g ? t("grade.rerun") : t("grade.run")
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {g ? (
          <>
            <GradePill part={t("grade.title")} grade={g.title_grade} tip={g.title_tip} />
            <GradePill part={t("grade.description")} grade={g.description_grade} tip={g.description_tip} />
          </>
        ) : (
          <span className="text-muted-foreground text-xs">{t("grade.none")}</span>
        )}
        {g && item.grade_stale ? (
          <span className="bg-warning-muted text-warning rounded-full px-2 py-0.5 text-xs">{t("grade.stale")}</span>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={grade.isPending}
          onClick={() => grade.mutate()}
          className="h-7 gap-1 px-2 text-xs"
        >
          <Icons.sparkles aria-hidden className="size-3.5" />
          {label}
        </Button>
      </div>
      {tips && g ? (
        <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
          <li>
            <span className="text-foreground font-medium">{t("grade.title")}:</span> {g.title_tip}
          </li>
          <li>
            <span className="text-foreground font-medium">{t("grade.description")}:</span> {g.description_tip}
          </li>
        </ul>
      ) : null}
    </div>
  )
}
