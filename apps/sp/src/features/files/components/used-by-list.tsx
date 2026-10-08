"use client"

import type { UsedBy } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge } from "@ihsp/ui"

/** Where a file is used: links, lessons, chats. */
export function UsedByList({ items }: { items: UsedBy[] }) {
  const t = useT("files.usedBy")
  if (items.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-1" aria-label={t("label")}>
      {items.map((item) => (
        <li key={`${item.kind}:${item.id}`}>
          <Badge variant="outline" className="max-w-full">
            <span className="truncate">
              {t(item.kind)}: {item.label}
            </span>
          </Badge>
        </li>
      ))}
    </ul>
  )
}
