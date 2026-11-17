"use client"

import { useT } from "@ihsp/i18n"
import { Button, cn, Icons, MOTION, Pill } from "@ihsp/ui"
import Link from "next/link"
import { ACTIVITY_CATEGORIES, type Item } from "../api"
import { ItemGrades } from "./item-grades"
import { POST_GRAD } from "./item-fields"

const chip = "bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-lg leading-tight font-semibold tabular-nums">{value}</span>
    </div>
  )
}

/** One activity or honor as a card; it mounts fresh in its column, so a status change plays the enter animation. */
export function ItemCard({
  item,
  onEdit,
  onDelete,
  className,
}: {
  item: Item
  onEdit?: (item: Item) => void
  onDelete?: (item: Item) => void
  className?: string
}) {
  const t = useT("items")
  const honor = item.kind === "honor"
  const grades = item.grades.map((g) => (g === POST_GRAD ? t("form.postGrad") : String(g))).join(", ")
  const category = item.category
    ? honor
      ? t(`recognition.${item.category}`)
      : (ACTIVITY_CATEGORIES as readonly string[]).includes(item.category)
        ? t(`category.${item.category}`)
        : item.category
    : null
  const chips = [grades ? t("card.grades", { grades }) : null, ...item.timing.map((tm) => t(`timing.${tm}`))].filter(
    Boolean,
  )
  return (
    <div
      className={cn(
        "border-hairline bg-card animate-in fade-in slide-in-from-bottom-1 rounded-card flex flex-1 items-start gap-1 border p-3",
        MOTION.slide,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Link
          href={`/activities/view/?id=${encodeURIComponent(item.id)}`}
          className="hover:bg-muted/40 flex min-h-11 min-w-0 flex-col gap-1.5 rounded-md transition-colors"
        >
          <span className="flex flex-wrap items-center gap-1.5">
            {category ? (
              <Pill tone={honor ? "warning" : "primary"} className="h-6 px-2 text-xs">
                {category}
              </Pill>
            ) : null}
            {honor ? (
              <Pill tone={item.status === "ready" ? "success" : "warning"} className="h-6 px-2 text-xs">
                {t(`status.${item.status}`)}
              </Pill>
            ) : null}
          </span>
          <span className="font-medium">{item.title}</span>
          {item.organization ? <span className="text-muted-foreground text-sm">{item.organization}</span> : null}
          {!honor && (item.hours_per_week != null || item.weeks_per_year != null) ? (
            <span className="mt-1 flex gap-6">
              {item.hours_per_week != null ? <Stat label={t("stat.hours")} value={item.hours_per_week} /> : null}
              {item.weeks_per_year != null ? <Stat label={t("stat.weeks")} value={item.weeks_per_year} /> : null}
            </span>
          ) : null}
          {chips.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {chips.map((c) => (
                <span key={c} className={chip}>
                  {c}
                </span>
              ))}
            </span>
          ) : null}
          {item.intend_in_college ? (
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Icons.check aria-hidden className="size-3.5" />
              {t("card.continue")}
            </span>
          ) : null}
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Icons.sparkles aria-hidden className="size-3.5" />
            {item.metrics.length > 0 ? t("card.metrics", { count: item.metrics.length }) : t("card.noMetrics")}
          </span>
        </Link>
        <ItemGrades item={item} />
      </div>
      {onEdit ? (
        <Button type="button" variant="ghost" size="icon" aria-label={t("card.edit")} onClick={() => onEdit(item)}>
          <Icons.edit aria-hidden />
        </Button>
      ) : null}
      {onDelete ? (
        <Button type="button" variant="ghost" size="icon" aria-label={t("card.delete")} onClick={() => onDelete(item)}>
          <Icons.trash aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}
