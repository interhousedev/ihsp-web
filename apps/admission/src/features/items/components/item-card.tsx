"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons, MOTION, Pill } from "@ihsp/ui"
import Link from "next/link"
import type { Item } from "../api"
import { POST_GRAD } from "./item-fields"

const chip = "bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"

/** One activity or honor as a card; it mounts fresh in its column, so a status change plays the enter animation. */
export function ItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Item
  onEdit?: (item: Item) => void
  onDelete?: (item: Item) => void
}) {
  const t = useT("items")
  const hours =
    item.hours_per_week != null && item.weeks_per_year != null
      ? t("card.hours", { h: item.hours_per_week, w: item.weeks_per_year })
      : null
  const grades = item.grades.map((g) => (g === POST_GRAD ? t("form.postGrad") : String(g))).join(", ")
  const category = item.category ? (item.kind === "honor" ? t(`recognition.${item.category}`) : item.category) : null
  const chips = [
    grades ? t("card.grades", { grades }) : null,
    ...item.timing.map((tm) => t(`timing.${tm}`)),
    hours,
  ].filter(Boolean)
  return (
    <div
      className={`border-hairline bg-card animate-in fade-in slide-in-from-bottom-1 flex flex-1 items-start gap-1 rounded-card border p-3 ${MOTION.slide}`}
    >
      <Link
        href={`/activities/view/?id=${encodeURIComponent(item.id)}`}
        className="hover:bg-muted/40 flex min-h-11 min-w-0 flex-1 flex-col gap-1 rounded-md transition-colors"
      >
        {category ? (
          <Pill tone={item.kind === "honor" ? "warning" : "primary"} className="h-6 px-2 text-xs">
            {category}
          </Pill>
        ) : null}
        <span className="font-medium">{item.title}</span>
        {item.organization ? <span className="text-muted-foreground text-sm">{item.organization}</span> : null}
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
