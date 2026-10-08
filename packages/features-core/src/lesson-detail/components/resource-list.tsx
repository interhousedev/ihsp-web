"use client"

import type { ResourceItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Icons, buttonVariants, cn } from "@ihsp/ui"
import { formatBytes } from "../utils/format-bytes"
import { fullName } from "../utils/people"

/**
 * Materials or attachments of a lesson: title, author, size, an open link (the short link) and, for the teacher's own
 * items, a delete button. Student attachments can be hidden and shown again (STF-6, UF-STF-08).
 */
export function ResourceList({
  items,
  currentUserId,
  canDeleteAny = false,
  busyId,
  onDelete,
  onToggleHidden,
}: {
  items: ResourceItem[]
  currentUserId?: string
  /** Administration may delete any item, everybody else only their own (backend: author or admin). */
  canDeleteAny?: boolean
  /** The item with a request in flight: its buttons are disabled. */
  busyId?: string | null
  onDelete?: (item: ResourceItem) => void
  onToggleHidden?: (item: ResourceItem) => void
}) {
  const t = useT("lessonDetail.resources")
  const f = useFormatters()
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.link_id}
          data-testid="resource-item"
          data-hidden={item.hidden}
          className="flex min-h-11 flex-wrap items-center gap-3 rounded-lg border p-2"
        >
          {item.kind === "file" ? (
            <Icons.page className="text-muted-foreground size-5 shrink-0" aria-hidden />
          ) : (
            <Icons.links className="text-muted-foreground size-5 shrink-0" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
              <span className="truncate">{item.title}</span>
              {item.hidden ? <Badge variant="outline">{t("hidden")}</Badge> : null}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {[
                fullName(item.author),
                item.file ? formatBytes(item.file.byte_size) : null,
                f.date(item.created_at, { day: "numeric", month: "short" }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={item.short_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "min-h-11 md:min-h-8")}
              aria-label={t("openItem", { title: item.title })}
            >
              {t("open")}
            </a>
            {onToggleHidden ? (
              <Button
                variant="ghost"
                className="min-h-11 md:min-h-8"
                disabled={busyId === item.link_id}
                aria-label={t(item.hidden ? "showItem" : "hideItem", { title: item.title })}
                onClick={() => onToggleHidden(item)}
              >
                {item.hidden ? t("show") : t("hide")}
              </Button>
            ) : null}
            {onDelete && currentUserId && (canDeleteAny || item.author.id === currentUserId) ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-11 md:size-8"
                disabled={busyId === item.link_id}
                aria-label={t("deleteItem", { title: item.title })}
                onClick={() => onDelete(item)}
              >
                <Icons.trash aria-hidden />
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}
